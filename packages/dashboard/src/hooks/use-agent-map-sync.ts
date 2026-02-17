import { useEffect, useRef, useCallback } from "react";
import { useSessionStore } from "../stores/session-store";
import { useAgentMapStore } from "../stores/agent-map-store";
import {
  getAgentZone,
  getAnimationFromStatus,
  generateActivityLabel,
  getAgentPose,
  generateDidacticDescription,
} from "../components/agent-map/zone-logic";

const BUBBLE_EXPIRY_MS = 5_000;
const LINE_EXPIRY_MS = 5_000;
const SYNC_DEBOUNCE_MS = 100;
const PERIODIC_REFRESH_MS = 10_000;

/**
 * Known parent names that are typically the team lead / orchestrator.
 * When we see these names, we know other agents are likely their children.
 */
const LEAD_AGENT_NAMES = new Set([
  "main",
  "team-lead",
  "team_lead",
  "teamlead",
  "lead",
  "orchestrator",
  "coordinator",
]);

/**
 * Parse event input safely, returning null on failure.
 */
function safeParseInput(
  input: string | undefined,
): Record<string, unknown> | null {
  if (!input) return null;
  try {
    const parsed: unknown = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // not JSON
  }
  return null;
}

export function useAgentMapSync() {
  const agents = useSessionStore((s) => s.agents);
  const events = useSessionStore((s) => s.events);
  const activityWindow = useSessionStore((s) => s.activityWindow);
  const displayMode = useAgentMapStore((s) => s.displayMode);
  const {
    setAgentPosition,
    setAgentAnimation,
    addSpeechBubble,
    addInteractionLine,
    clearExpiredBubbles,
    clearExpiredLines,
  } = useAgentMapStore();

  const lastSyncRef = useRef(0);
  const processedEventsRef = useRef(new Set<string>());
  /** Tracks detected parent-child relationships: childId -> parentId */
  const parentMapRef = useRef(new Map<string, string>());

  /**
   * Detect parent-child relationships from events.
   * Called once per new event batch. Strategies:
   * 1. Task tool with run_in_background -> caller is parent of the task owner
   * 2. SendMessage with type "spawn" -> sender is parent
   * 3. "main" agent is parent of all other agents by default
   */
  const detectParentChild = useCallback(() => {
    const agentIds = new Set(agents.map((a) => a.id));
    const agentNameMap = new Map<string, string>();
    for (const agent of agents) {
      agentNameMap.set(agent.id, agent.name.toLowerCase());
    }

    // Strategy 1: Find the "lead" agent by name convention
    let leadAgentId: string | null = null;
    for (const agent of agents) {
      if (LEAD_AGENT_NAMES.has(agent.name.toLowerCase())) {
        leadAgentId = agent.id;
        break;
      }
    }

    // Strategy 2: Scan events for Task/TeamCreate patterns
    for (const event of events) {
      if (processedEventsRef.current.has(`parent-${event.id}`)) continue;

      // TaskCreate where the calling agent spawns a task for another agent
      if (event.tool === "TaskCreate" || event.tool === "Task") {
        const input = safeParseInput(event.input);
        if (input) {
          // If the task has an assignee, the calling agent is the parent
          const assignee = input.assignee ?? input.owner ?? input.agent;
          if (
            typeof assignee === "string" &&
            agentIds.has(assignee) &&
            assignee !== event.agentId
          ) {
            parentMapRef.current.set(assignee, event.agentId);
          }
          // run_in_background pattern: caller is the orchestrator
          if (input.run_in_background === true) {
            // The calling agent is likely the parent/lead
            if (!leadAgentId) {
              leadAgentId = event.agentId;
            }
          }
        }
      }

      // SendMessage spawn pattern
      if (event.tool === "SendMessage") {
        const input = safeParseInput(event.input);
        if (input && input.type === "spawn") {
          const recipient = input.recipient ?? input.target_agent_id;
          if (typeof recipient === "string" && agentIds.has(recipient)) {
            parentMapRef.current.set(recipient, event.agentId);
          }
        }
      }
    }

    // Strategy 3: If we have a lead agent and multiple agents, assign unparented agents
    // to the lead agent as their parent (default hierarchy)
    if (leadAgentId && agents.length > 1) {
      for (const agent of agents) {
        if (agent.id === leadAgentId) continue;
        if (!parentMapRef.current.has(agent.id)) {
          parentMapRef.current.set(agent.id, leadAgentId);
        }
      }
    }
  }, [agents, events]);

  const syncPositions = useCallback(() => {
    const now = Date.now();

    // Detect parent-child before syncing positions
    detectParentChild();

    for (const agent of agents) {
      // Find the most recent event for this agent (events are newest-first)
      const lastEvent = events.find((e) => e.agentId === agent.id);
      const lastToolEvent = events.find(
        (e) => e.agentId === agent.id && e.tool,
      );
      const lastTool = lastToolEvent?.tool ?? null;
      const lastToolInput = lastToolEvent?.input ?? null;

      // Use the LAST EVENT timestamp (much fresher than agent.lastActivityAt)
      const lastEventTimestamp = lastEvent?.timestamp
        ? new Date(lastEvent.timestamp).getTime()
        : new Date(agent.lastActivityAt).getTime();
      const lastEventMs = now - lastEventTimestamp;

      // Determine zone based on last tool and freshness
      const zone = getAgentZone(
        lastTool,
        agent.status,
        lastEventMs,
        activityWindow,
      );

      // Determine animation based on status AND event freshness
      const animation = getAnimationFromStatus(
        agent.status,
        lastEventMs,
        activityWindow,
      );

      // Generate human-readable activity label
      const activityLabel = generateActivityLabel(
        lastTool,
        lastToolInput,
        agent.status,
        lastEventMs,
        activityWindow,
      );

      // Mission Floor v2: determine pose from tool
      const pose = getAgentPose(
        lastTool,
        agent.status,
        lastEventMs,
        activityWindow,
      );

      // Look up parent from detected relationships
      const parentAgentId = parentMapRef.current.get(agent.id) ?? null;

      setAgentPosition(
        agent.id,
        zone,
        lastTool,
        activityLabel,
        pose,
        parentAgentId,
      );
      setAgentAnimation(agent.id, animation);
    }
  }, [
    agents,
    events,
    activityWindow,
    setAgentPosition,
    setAgentAnimation,
    detectParentChild,
  ]);

  // Sync agent positions from session-store agents + events
  useEffect(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_DEBOUNCE_MS) return;
    lastSyncRef.current = now;
    syncPositions();
  }, [agents, events, syncPositions]);

  // Periodic refresh to update idle timers and catch state transitions
  useEffect(() => {
    const interval = setInterval(() => {
      syncPositions();
    }, PERIODIC_REFRESH_MS);
    return () => clearInterval(interval);
  }, [syncPositions]);

  // Process new events for speech bubbles and interaction lines
  useEffect(() => {
    for (const event of events) {
      if (processedEventsRef.current.has(event.id)) continue;
      processedEventsRef.current.add(event.id);

      // Limit set size
      if (processedEventsRef.current.size > 200) {
        const arr = Array.from(processedEventsRef.current);
        processedEventsRef.current = new Set(arr.slice(-100));
      }

      // Detect SendMessage -> speech bubble + interaction line
      if (event.tool === "SendMessage" && event.input) {
        const input = safeParseInput(event.input);
        if (input) {
          const recipient = (input.recipient ?? input.target_agent_id) as
            | string
            | undefined;
          const content = (input.content ?? input.message ?? "") as string;
          if (recipient && content) {
            addSpeechBubble({
              id: `bubble-${event.id}`,
              fromAgentId: event.agentId,
              toAgentId: recipient,
              message:
                displayMode === "didactic"
                  ? (generateDidacticDescription(
                      "SendMessage",
                      event.input,
                      "active",
                      0,
                      activityWindow,
                    ) ?? content.slice(0, 120))
                  : content.slice(0, 120),
              timestamp: Date.now(),
            });
            addInteractionLine({
              id: `line-${event.id}`,
              fromAgentId: event.agentId,
              toAgentId: recipient,
              type: "message",
              timestamp: Date.now(),
            });
          }
        }
      }

      // Detect Task tool for spawn/assign
      if (event.tool === "TaskUpdate" && event.input) {
        const input = safeParseInput(event.input);
        if (input?.owner) {
          addInteractionLine({
            id: `assign-${event.id}`,
            fromAgentId: event.agentId,
            toAgentId: input.owner as string,
            type: "task_assign",
            timestamp: Date.now(),
          });
        }
      }

      // Didactic mode: show educational speech bubbles for all tool events
      if (
        displayMode === "didactic" &&
        event.tool &&
        event.tool !== "SendMessage"
      ) {
        const didacticText = generateDidacticDescription(
          event.tool,
          event.input,
          // We don't have agent status here, use 'active' as default
          "active",
          0, // recent event
          activityWindow,
        );
        if (didacticText) {
          addSpeechBubble({
            id: `didactic-${event.id}`,
            fromAgentId: event.agentId,
            toAgentId: event.agentId, // self-bubble (thinking out loud)
            message: didacticText,
            timestamp: Date.now(),
          });
        }
      }
    }
  }, [
    events,
    activityWindow,
    addSpeechBubble,
    addInteractionLine,
    displayMode,
  ]);

  // Periodic cleanup of expired bubbles and lines
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredBubbles(BUBBLE_EXPIRY_MS);
      clearExpiredLines(LINE_EXPIRY_MS);
    }, 1_000);
    return () => clearInterval(interval);
  }, [clearExpiredBubbles, clearExpiredLines]);

  // Cleanup: remove positions for agents no longer in session store
  useEffect(() => {
    const agentIds = new Set(agents.map((a) => a.id));
    const { positions, removeAgent } = useAgentMapStore.getState();
    for (const posAgentId of positions.keys()) {
      if (!agentIds.has(posAgentId)) {
        removeAgent(posAgentId);
      }
    }
  }, [agents]);
}
