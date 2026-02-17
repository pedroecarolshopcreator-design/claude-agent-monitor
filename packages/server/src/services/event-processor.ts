import { randomUUID } from "node:crypto";
import type { AgentEvent, EventCategory, HookType } from "@cam/shared";
import {
  FILE_CHANGE_TOOLS,
  FILE_READ_TOOLS,
  COMMAND_TOOLS,
  MESSAGE_TOOLS,
  MAX_INPUT_LENGTH,
  MAX_OUTPUT_LENGTH,
} from "@cam/shared";
import {
  eventQueries,
  agentQueries,
  sessionQueries,
  fileChangeQueries,
  taskItemQueries,
  sessionGroupQueries,
  sessionGroupMemberQueries,
} from "../db/queries.js";
import { sseManager } from "./sse-manager.js";

/**
 * Track spawned subagents per session for SubagentStop correlation.
 * When a Task tool is detected, we create a virtual agent and queue its ID.
 * When SubagentStop fires, we dequeue the oldest virtual agent (FIFO).
 */
const spawnedSubagentQueue = new Map<string, string[]>();

/**
 * Session grouping timeout (ms). When a new session appears within this window
 * of an active group's last activity, it is auto-added to the group.
 * Default: 5 minutes. Covers tmux pane startup delay for Claude Code Teams.
 */
const SESSION_GROUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * Queue of pending agent names from Task tool calls.
 * When main agent spawns a subagent via Task tool with a `name` parameter,
 * we queue that name. When a new SessionStart arrives (the subagent starting),
 * we dequeue and assign the name to that session's agent.
 */
const pendingAgentNames: string[] = [];

/**
 * Resolve agent name from pending queue (FIFO).
 * Returns the next queued name or undefined if queue is empty.
 */
function resolveNameFromPendingQueue(sessionId: string): string | undefined {
  // Only consume from queue for new sessions (not for existing ones)
  const groupId = getGroupIdForSession(sessionId);
  if (groupId && pendingAgentNames.length > 0) {
    return pendingAgentNames.shift();
  }
  return undefined;
}

/** Stale session timeout (ms). Sessions inactive for this long are marked completed. */
const STALE_SESSION_TIMEOUT_MS = 10 * 60 * 1000;

interface IncomingEvent {
  hook: HookType;
  timestamp?: string;
  session_id?: string;
  agent_id?: string;
  data?: Record<string, unknown>;
  tool?: string;
  input?: unknown;
}

function truncate(val: unknown, maxLen: number): string | undefined {
  if (val === undefined || val === null) return undefined;
  const str = typeof val === "string" ? val : JSON.stringify(val);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function categorizeEvent(hookType: HookType, toolName?: string): EventCategory {
  if (hookType === "Notification") return "notification";
  if (hookType === "PreCompact" || hookType === "PostCompact") return "compact";
  if (
    hookType === "Stop" ||
    hookType === "SubagentStop" ||
    hookType === "SessionStart"
  )
    return "lifecycle";
  if (hookType === "ToolError" || hookType === "PreToolUseRejected")
    return "error";

  if (toolName) {
    if ((FILE_CHANGE_TOOLS as readonly string[]).includes(toolName))
      return "file_change";
    if ((COMMAND_TOOLS as readonly string[]).includes(toolName))
      return "command";
    if ((MESSAGE_TOOLS as readonly string[]).includes(toolName))
      return "message";
  }

  return "tool_call";
}

function extractFilePath(
  toolName: string | undefined,
  data: Record<string, unknown> | undefined,
  input: unknown,
): string | undefined {
  if (!data && !input) return undefined;

  const sources = [
    data,
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : undefined,
  ];

  for (const src of sources) {
    if (!src) continue;
    const toolInput = (src["tool_input"] ?? src) as Record<string, unknown>;
    if (typeof toolInput !== "object" || toolInput === null) continue;

    const path =
      toolInput["file_path"] ?? toolInput["path"] ?? toolInput["filePath"];
    if (typeof path === "string") return path;
  }

  return undefined;
}

function extractToolName(incoming: IncomingEvent): string | undefined {
  if (incoming.tool) return incoming.tool;
  if (
    incoming.data?.["tool_name"] &&
    typeof incoming.data["tool_name"] === "string"
  ) {
    return incoming.data["tool_name"];
  }
  return undefined;
}

function extractDuration(data?: Record<string, unknown>): number | undefined {
  if (!data) return undefined;
  const dur = data["duration_ms"] ?? data["duration"];
  return typeof dur === "number" ? dur : undefined;
}

function extractError(data?: Record<string, unknown>): string | undefined {
  if (!data) return undefined;
  const err = data["error_message"] ?? data["error"];
  return typeof err === "string" ? err : undefined;
}

export function processEvent(incoming: IncomingEvent): AgentEvent {
  const now = new Date().toISOString();
  const sessionId = incoming.session_id || "default";
  const agentId = incoming.agent_id || "main";
  const toolName = extractToolName(incoming);
  const category = categorizeEvent(incoming.hook, toolName);

  const inputStr =
    incoming.data?.["tool_input"] ?? incoming.input ?? incoming.data;
  const outputStr = incoming.data?.["tool_output"] ?? incoming.data?.["output"];

  const event: AgentEvent = {
    id: randomUUID(),
    sessionId,
    agentId,
    timestamp: incoming.timestamp || now,
    hookType: incoming.hook,
    category,
    tool: toolName,
    filePath: extractFilePath(toolName, incoming.data, incoming.input),
    input: truncate(inputStr, MAX_INPUT_LENGTH),
    output: truncate(outputStr, MAX_OUTPUT_LENGTH),
    error: extractError(incoming.data),
    duration: extractDuration(incoming.data),
    metadata: incoming.data,
  };

  persistEvent(event, now);

  // Broadcast event to the session's own listeners
  sseManager.broadcast("agent_event", event, sessionId);

  // Cross-group broadcasting: also send to all other sessions in the same group
  const groupId = getGroupIdForSession(sessionId);
  if (groupId) {
    broadcastToGroupExcluding(groupId, "agent_event", event, sessionId);
  }

  return event;
}

/**
 * Handle session grouping for multi-agent teams.
 * When Claude Code Teams runs with tmux, each agent gets its own session_id.
 * This function groups them together so the dashboard can show a unified view.
 */
function handleSessionGrouping(event: AgentEvent, isNewSession: boolean): void {
  try {
    const sessionId = event.sessionId;

    // Check if this session already belongs to a group
    const existingMember = sessionGroupMemberQueries
      .getBySessionId()
      .get(sessionId) as Record<string, unknown> | undefined;
    if (existingMember) {
      // Already grouped - nothing to do for grouping
      return;
    }

    // Check for an active group
    const activeGroup = sessionGroupQueries.getActiveGroup().get() as
      | Record<string, unknown>
      | undefined;

    if (event.hookType === "SessionStart") {
      if (activeGroup) {
        // Active group exists - add this session as a member (likely a teammate)
        // Try to resolve name from pending queue first (Task tool correlation)
        const pendingName =
          pendingAgentNames.length > 0 ? pendingAgentNames.shift() : undefined;
        const agentName =
          pendingName ||
          (event.metadata?.["agent_name"] as string) ||
          (event.metadata?.["agent_type"] as string) ||
          undefined;
        const agentType =
          (event.metadata?.["agent_type"] as string) || undefined;
        sessionGroupMemberQueries
          .add()
          .run(
            activeGroup["id"] as string,
            sessionId,
            agentName || null,
            agentType || null,
            event.timestamp,
          );

        // Update agent name retroactively if resolved from pending queue
        if (agentName) {
          agentQueries.updateAgentName().run(agentName, sessionId, sessionId);
        }

        const groupId = activeGroup["id"] as string;
        sseManager.broadcast(
          "session_group_member_added",
          {
            groupId,
            sessionId,
            agentName,
            agentType,
            timestamp: event.timestamp,
          },
          sessionId,
        );

        // Also broadcast to all existing group members
        broadcastToGroup(groupId, "session_group_member_added", {
          groupId,
          sessionId,
          agentName,
          agentType,
          timestamp: event.timestamp,
        });
      } else {
        // No active group - create one with this session as main
        const groupId = randomUUID();
        const groupName =
          (event.metadata?.["working_directory"] as string)?.split("/").pop() ||
          "team";
        sessionGroupQueries
          .create()
          .run(groupId, groupName, sessionId, event.timestamp);
        sessionGroupMemberQueries
          .add()
          .run(groupId, sessionId, "main", null, event.timestamp);

        sseManager.broadcast(
          "session_group_created",
          {
            groupId,
            name: groupName,
            mainSessionId: sessionId,
            timestamp: event.timestamp,
          },
          sessionId,
        );
      }
      return;
    }

    // For new sessions that appear without a SessionStart hook (common case)
    if (isNewSession) {
      if (activeGroup) {
        // Check if the active group had recent activity (within the grouping window).
        // Use latest member join time (not group creation time) so that teams
        // that form gradually still group correctly.
        const groupId = activeGroup["id"] as string;
        const latestRow = sessionGroupQueries
          .getLatestMemberJoinedAt()
          .get(groupId) as Record<string, unknown> | undefined;
        const latestJoined = latestRow?.["latest_joined_at"] as
          | string
          | undefined;
        const referenceTime =
          latestJoined || (activeGroup["created_at"] as string);
        const refMs = new Date(referenceTime).getTime();
        const eventTime = new Date(event.timestamp).getTime();

        if (eventTime - refMs < SESSION_GROUP_WINDOW_MS) {
          // Within the window - add as member
          const agentName =
            (event.metadata?.["agent_name"] as string) || undefined;
          const agentType =
            (event.metadata?.["agent_type"] as string) || undefined;
          sessionGroupMemberQueries
            .add()
            .run(
              groupId,
              sessionId,
              agentName || null,
              agentType || null,
              event.timestamp,
            );

          broadcastToGroup(groupId, "session_group_member_added", {
            groupId,
            sessionId,
            agentName,
            agentType,
            timestamp: event.timestamp,
          });
          return;
        }
      }

      // No active group or outside the window - create a new group
      const groupId = randomUUID();
      const workDir = (event.metadata?.["working_directory"] as string) || "";
      const groupName =
        workDir.split("/").pop() || workDir.split("\\").pop() || "session";
      sessionGroupQueries
        .create()
        .run(groupId, groupName, sessionId, event.timestamp);
      sessionGroupMemberQueries
        .add()
        .run(groupId, sessionId, "main", null, event.timestamp);

      sseManager.broadcast(
        "session_group_created",
        {
          groupId,
          name: groupName,
          mainSessionId: sessionId,
          timestamp: event.timestamp,
        },
        sessionId,
      );
    }

    // Handle TeamCreate tool - ensure a group exists and update its name
    if (event.tool === "TeamCreate") {
      let teamName = "team";
      try {
        const input = (event.metadata?.["tool_input"] ??
          event.metadata) as Record<string, unknown>;
        teamName =
          (input?.["team_name"] as string) ??
          (input?.["teamName"] as string) ??
          "team";
      } catch {
        // skip
      }

      const existingGroupForSession = sessionGroupQueries
        .getBySessionId()
        .get(sessionId) as Record<string, unknown> | undefined;
      if (existingGroupForSession) {
        // Group exists - update the name if it's generic (e.g., 'session', 'team')
        const currentName = existingGroupForSession["name"] as string;
        if (
          !currentName ||
          currentName === "session" ||
          currentName === "team"
        ) {
          sessionGroupQueries
            .updateName()
            .run(teamName, existingGroupForSession["id"] as string);
        }
      } else {
        // No group exists - create one
        const groupId = randomUUID();
        sessionGroupQueries
          .create()
          .run(groupId, teamName, sessionId, event.timestamp);
        sessionGroupMemberQueries
          .add()
          .run(groupId, sessionId, "main", null, event.timestamp);

        sseManager.broadcast(
          "session_group_created",
          {
            groupId,
            name: teamName,
            mainSessionId: sessionId,
            timestamp: event.timestamp,
          },
          sessionId,
        );
      }
    }
  } catch {
    // Grouping errors should not break event processing
  }
}

/**
 * Broadcast an SSE event to all sessions in a group.
 * This ensures the dashboard sees events from all agents regardless of which session they're in.
 */
function broadcastToGroup(
  groupId: string,
  eventType: string,
  data: unknown,
): void {
  try {
    const members = sessionGroupMemberQueries
      .getAllSessionIdsInGroup()
      .all(groupId) as Array<Record<string, unknown>>;
    for (const member of members) {
      const memberSessionId = member["session_id"] as string;
      sseManager.broadcast(eventType, data, memberSessionId);
    }
  } catch {
    // ignore broadcast errors
  }
}

/**
 * Broadcast to all sessions in a group EXCEPT the specified session.
 * Used to avoid double-broadcasting to the originating session.
 */
function broadcastToGroupExcluding(
  groupId: string,
  eventType: string,
  data: unknown,
  excludeSessionId: string,
): void {
  try {
    const members = sessionGroupMemberQueries
      .getAllSessionIdsInGroup()
      .all(groupId) as Array<Record<string, unknown>>;
    for (const member of members) {
      const memberSessionId = member["session_id"] as string;
      if (memberSessionId !== excludeSessionId) {
        sseManager.broadcast(eventType, data, memberSessionId);
      }
    }
  } catch {
    // ignore broadcast errors
  }
}

/**
 * Get the group ID for a session (if any), for cross-session broadcasting.
 */
function getGroupIdForSession(sessionId: string): string | undefined {
  try {
    const group = sessionGroupQueries.getBySessionId().get(sessionId) as
      | Record<string, unknown>
      | undefined;
    return group ? (group["id"] as string) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if all sessions in a group are completed.
 * If so, broadcast a group_completed event.
 */
function checkGroupCompletion(groupId: string, now: string): void {
  try {
    const members = sessionGroupMemberQueries
      .getByGroup()
      .all(groupId) as Array<Record<string, unknown>>;
    const allCompleted = members.every((m) => {
      const status = m["session_status"] as string;
      return status === "completed" || status === "error";
    });
    if (allCompleted && members.length > 0) {
      broadcastToGroup(groupId, "session_group_completed", {
        groupId,
        timestamp: now,
        memberCount: members.length,
      });
    }
  } catch {
    // ignore
  }
}

function persistEvent(event: AgentEvent, now: string): void {
  // Ensure session exists
  const existingSession = sessionQueries.getById().get(event.sessionId) as
    | Record<string, unknown>
    | undefined;
  const isNewSession = !existingSession;
  if (!existingSession) {
    const workDir =
      (event.metadata?.["working_directory"] as string) || process.cwd();
    sessionQueries
      .insert()
      .run(event.sessionId, event.timestamp, workDir, "active", 0, 0, null);
  } else if (
    existingSession["status"] === "completed" ||
    existingSession["status"] === "error"
  ) {
    // Reactivate session when new events arrive (e.g., after context compaction)
    sessionQueries.updateStatus().run("active", null, event.sessionId);
    // Re-activate the main agent too
    agentQueries.updateStatus().run("active", now, "main", event.sessionId);
    sseManager.broadcast(
      "session_status",
      {
        session: event.sessionId,
        status: "active",
      },
      event.sessionId,
    );
  }

  // Handle session grouping for multi-agent teams
  handleSessionGrouping(event, isNewSession);

  sessionQueries.incrementEventCount().run(event.sessionId);

  // Ensure agent exists
  const existingAgent = agentQueries
    .getById()
    .get(event.agentId, event.sessionId) as Record<string, unknown> | undefined;
  if (!existingAgent) {
    // Agent name resolution with 3 layers:
    // Layer 1: agent_type from SubagentStart metadata (most reliable)
    // Layer 2: agent_name from metadata
    // Layer 3: Fallback to agentId (dashboard generates friendly name)
    const agentType =
      (event.metadata?.["agent_type"] as string) || "general-purpose";
    const agentNameFromType =
      event.hookType === "SessionStart" && event.metadata?.["agent_type"]
        ? (event.metadata["agent_type"] as string)
        : undefined;
    const agentName =
      agentNameFromType ||
      (event.metadata?.["agent_name"] as string) ||
      resolveNameFromPendingQueue(event.sessionId) ||
      event.agentId;
    agentQueries
      .upsert()
      .run(
        event.agentId,
        event.sessionId,
        agentName,
        agentType,
        "active",
        event.timestamp,
        event.timestamp,
      );

    const agents = agentQueries
      .getBySession()
      .all(event.sessionId) as unknown[];
    sessionQueries.updateAgentCount().run(agents.length, event.sessionId);

    // Emit agent_created SSE event
    const agentCreatedPayload = {
      agent: event.agentId,
      sessionId: event.sessionId,
      name: agentName,
      type: agentType,
      status: "active",
      timestamp: event.timestamp,
    };
    sseManager.broadcast("agent_created", agentCreatedPayload, event.sessionId);
    // Cross-group broadcast
    const gidCreated = getGroupIdForSession(event.sessionId);
    if (gidCreated) {
      broadcastToGroupExcluding(
        gidCreated,
        "agent_created",
        agentCreatedPayload,
        event.sessionId,
      );
    }
  }

  // Update agent status
  if (event.hookType === "PreToolUse" || event.hookType === "PostToolUse") {
    // Only count tool calls and broadcast status on PostToolUse
    // PreToolUse only updates lastActivityAt silently (no SSE broadcast)
    if (event.hookType === "PostToolUse") {
      agentQueries
        .incrementToolCalls()
        .run(now, event.agentId, event.sessionId);
      agentQueries
        .updateStatus()
        .run("active", now, event.agentId, event.sessionId);

      const activePayload = {
        agent: event.agentId,
        sessionId: event.sessionId,
        status: "active",
      };
      sseManager.broadcast("agent_status", activePayload, event.sessionId);
      const gidActive = getGroupIdForSession(event.sessionId);
      if (gidActive) {
        broadcastToGroupExcluding(
          gidActive,
          "agent_status",
          activePayload,
          event.sessionId,
        );
      }
    } else {
      // PreToolUse: just update timestamp, no SSE broadcast
      agentQueries
        .updateStatus()
        .run("active", now, event.agentId, event.sessionId);
    }
  }

  if (event.category === "error") {
    agentQueries.incrementErrors().run(now, event.agentId, event.sessionId);
    agentQueries
      .updateStatus()
      .run("error", now, event.agentId, event.sessionId);

    const errorPayload = {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: "error",
    };
    sseManager.broadcast("agent_status", errorPayload, event.sessionId);
    const gidError = getGroupIdForSession(event.sessionId);
    if (gidError) {
      broadcastToGroupExcluding(
        gidError,
        "agent_status",
        errorPayload,
        event.sessionId,
      );
    }
  }

  if (event.hookType === "Stop") {
    agentQueries
      .updateStatus()
      .run("completed", now, event.agentId, event.sessionId);
    const completedPayload = {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: "completed",
    };
    sseManager.broadcast("agent_status", completedPayload, event.sessionId);
    const gidStop = getGroupIdForSession(event.sessionId);
    if (gidStop) {
      broadcastToGroupExcluding(
        gidStop,
        "agent_status",
        completedPayload,
        event.sessionId,
      );
    }

    const activeAgents = (
      agentQueries.getBySession().all(event.sessionId) as Array<
        Record<string, unknown>
      >
    ).filter((a) => a["status"] === "active");
    if (activeAgents.length === 0) {
      sessionQueries.updateStatus().run("completed", now, event.sessionId);
      sseManager.broadcast(
        "session_status",
        {
          session: event.sessionId,
          status: "completed",
        },
        event.sessionId,
      );

      // Check if ALL sessions in the group are completed
      if (gidStop) {
        checkGroupCompletion(gidStop, now);
      }
    }
  }

  if (event.hookType === "SubagentStop") {
    // Correlate with spawned virtual agents (FIFO queue)
    const queue = spawnedSubagentQueue.get(event.sessionId);
    if (queue && queue.length > 0) {
      const subagentId = queue.shift()!;
      agentQueries
        .updateStatus()
        .run("shutdown", now, subagentId, event.sessionId);
      const shutdownPayload = {
        agent: subagentId,
        sessionId: event.sessionId,
        status: "shutdown",
      };
      sseManager.broadcast("agent_status", shutdownPayload, event.sessionId);
      const gidSub = getGroupIdForSession(event.sessionId);
      if (gidSub) {
        broadcastToGroupExcluding(
          gidSub,
          "agent_status",
          shutdownPayload,
          event.sessionId,
        );
      }
    }
    // NOTE: Do NOT mark event.agentId ('main') as shutdown - SubagentStop
    // means a SUBAGENT stopped, not the main agent.
  }

  // Detect Task tool -> create virtual subagent in Agent Map
  if (
    event.tool === "Task" &&
    event.hookType === "PostToolUse" &&
    event.metadata
  ) {
    try {
      const rawInput = event.metadata["tool_input"];
      const input =
        typeof rawInput === "string"
          ? (JSON.parse(rawInput) as Record<string, unknown>)
          : (rawInput as Record<string, unknown>);
      if (input && typeof input === "object") {
        const name =
          (input["name"] as string) ||
          (input["description"] as string)?.slice(0, 30) ||
          "subagent";
        const type = (input["subagent_type"] as string) || "general-purpose";
        const agentId = `subagent-${name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()}`;

        // Create virtual agent in DB
        const existingVirtualAgent = agentQueries
          .getById()
          .get(agentId, event.sessionId) as Record<string, unknown> | undefined;
        if (!existingVirtualAgent) {
          agentQueries
            .upsert()
            .run(
              agentId,
              event.sessionId,
              name,
              type,
              "active",
              event.timestamp,
              event.timestamp,
            );

          const agents = agentQueries
            .getBySession()
            .all(event.sessionId) as unknown[];
          sessionQueries.updateAgentCount().run(agents.length, event.sessionId);

          sseManager.broadcast(
            "agent_created",
            {
              agent: agentId,
              sessionId: event.sessionId,
              name,
              type,
              status: "active",
              timestamp: event.timestamp,
            },
            event.sessionId,
          );
        } else {
          // Reactivate if agent was previously shutdown (re-used name)
          agentQueries
            .updateStatus()
            .run("active", now, agentId, event.sessionId);
          sseManager.broadcast(
            "agent_status",
            {
              agent: agentId,
              sessionId: event.sessionId,
              status: "active",
            },
            event.sessionId,
          );
        }

        // Queue agent name for correlation with incoming SessionStart
        // When a new session appears, it will be assigned this name
        if (name !== "subagent") {
          pendingAgentNames.push(name);
        }

        // Queue for SubagentStop correlation
        if (!spawnedSubagentQueue.has(event.sessionId)) {
          spawnedSubagentQueue.set(event.sessionId, []);
        }
        spawnedSubagentQueue.get(event.sessionId)!.push(agentId);
      }
    } catch {
      // Failed to parse Task tool input
    }
  }

  // Track file changes
  if (event.filePath && event.category === "file_change") {
    const changeType = event.tool === "Write" ? "created" : "modified";
    fileChangeQueries
      .upsert()
      .run(
        event.filePath,
        event.sessionId,
        event.agentId,
        changeType,
        event.timestamp,
        event.timestamp,
      );
  } else if (
    event.filePath &&
    (FILE_READ_TOOLS as readonly string[]).includes(event.tool || "")
  ) {
    fileChangeQueries
      .upsert()
      .run(
        event.filePath,
        event.sessionId,
        event.agentId,
        "read",
        event.timestamp,
        event.timestamp,
      );
  }

  // Track task items from TaskCreate/TaskUpdate tools
  if (event.tool === "TaskCreate" && event.metadata) {
    const subject =
      (event.metadata["subject"] as string) ||
      ((event.metadata["tool_input"] as Record<string, unknown>)?.[
        "subject"
      ] as string) ||
      "Untitled Task";
    const taskId = randomUUID();
    taskItemQueries
      .upsert()
      .run(
        taskId,
        event.sessionId,
        subject,
        "pending",
        null,
        event.timestamp,
        event.timestamp,
      );
  }

  if (event.tool === "TaskUpdate" && event.metadata) {
    const input = (event.metadata["tool_input"] ?? event.metadata) as Record<
      string,
      unknown
    >;
    const taskId = (input["taskId"] as string) || "";
    const status = input["status"] as string | undefined;
    const owner = input["owner"] as string | undefined;
    if (taskId) {
      taskItemQueries
        .upsert()
        .run(
          taskId,
          event.sessionId,
          input["subject"] || "Updated Task",
          status || "pending",
          owner || null,
          event.timestamp,
          event.timestamp,
        );
    }
  }

  // Enrich SendMessage metadata with parsed recipient/content
  if (event.tool === "SendMessage" && event.metadata) {
    try {
      const input = (event.metadata["tool_input"] ?? event.metadata) as Record<
        string,
        unknown
      >;
      const recipient = input["recipient"] ?? input["target_agent_id"];
      const content = input["content"] ?? input["message"];
      const msgType = input["type"];
      if (typeof recipient === "string") {
        event.metadata["_parsed_recipient"] = recipient;
      }
      if (typeof content === "string") {
        event.metadata["_parsed_content"] = content.slice(0, 100);
      }
      if (typeof msgType === "string") {
        event.metadata["_parsed_msg_type"] = msgType;
      }
    } catch {
      // skip
    }
  }

  // Detect TeamCreate
  if (event.tool === "TeamCreate" && event.metadata) {
    try {
      const input = (event.metadata["tool_input"] ?? event.metadata) as Record<
        string,
        unknown
      >;
      const teamName = input["team_name"] ?? input["teamName"];
      if (typeof teamName === "string") {
        sseManager.broadcast(
          "team_created",
          {
            teamName,
            createdBy: event.agentId,
            sessionId: event.sessionId,
            timestamp: event.timestamp,
          },
          event.sessionId,
        );
      }
    } catch {
      // skip
    }
  }

  // Persist the event
  eventQueries
    .insert()
    .run(
      event.id,
      event.sessionId,
      event.agentId,
      event.timestamp,
      event.hookType,
      event.category,
      event.tool || null,
      event.filePath || null,
      event.input || null,
      event.output || null,
      event.error || null,
      event.duration || null,
      event.metadata ? JSON.stringify(event.metadata) : null,
    );
}

/**
 * Cleanup stale sessions: mark active sessions with no recent activity as completed.
 * Should be called periodically (e.g., every 60 seconds).
 */
export function cleanupStaleSessions(): void {
  try {
    const now = new Date().toISOString();
    const cutoff = new Date(
      Date.now() - STALE_SESSION_TIMEOUT_MS,
    ).toISOString();
    const staleSessions = sessionQueries
      .getActiveStaleSessions()
      .all(cutoff, cutoff) as Array<Record<string, unknown>>;

    for (const session of staleSessions) {
      const sessionId = session["id"] as string;
      sessionQueries.updateStatus().run("completed", now, sessionId);

      sseManager.broadcast(
        "session_status",
        {
          session: sessionId,
          status: "completed",
          reason: "stale_timeout",
        },
        sessionId,
      );

      // Check group completion
      const groupId = getGroupIdForSession(sessionId);
      if (groupId) {
        checkGroupCompletion(groupId, now);
      }
    }

    if (staleSessions.length > 0) {
      console.log(
        `[cleanup] Marked ${staleSessions.length} stale session(s) as completed`,
      );
    }
  } catch {
    // DB not ready or query error, skip silently
  }
}
