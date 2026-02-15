import { randomUUID } from 'node:crypto';
import type { AgentEvent, EventCategory, HookType } from '@cam/shared';
import {
  FILE_CHANGE_TOOLS,
  FILE_READ_TOOLS,
  COMMAND_TOOLS,
  MESSAGE_TOOLS,
  MAX_INPUT_LENGTH,
  MAX_OUTPUT_LENGTH,
} from '@cam/shared';
import { eventQueries, agentQueries, sessionQueries, fileChangeQueries, taskItemQueries } from '../db/queries.js';
import { sseManager } from './sse-manager.js';

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
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

function categorizeEvent(hookType: HookType, toolName?: string): EventCategory {
  if (hookType === 'Notification') return 'notification';
  if (hookType === 'PreCompact' || hookType === 'PostCompact') return 'compact';
  if (hookType === 'Stop' || hookType === 'SubagentStop' || hookType === 'SessionStart') return 'lifecycle';
  if (hookType === 'ToolError' || hookType === 'PreToolUseRejected') return 'error';

  if (toolName) {
    if ((FILE_CHANGE_TOOLS as readonly string[]).includes(toolName)) return 'file_change';
    if ((COMMAND_TOOLS as readonly string[]).includes(toolName)) return 'command';
    if ((MESSAGE_TOOLS as readonly string[]).includes(toolName)) return 'message';
  }

  return 'tool_call';
}

function extractFilePath(toolName: string | undefined, data: Record<string, unknown> | undefined, input: unknown): string | undefined {
  if (!data && !input) return undefined;

  const sources = [data, typeof input === 'object' && input !== null ? input as Record<string, unknown> : undefined];

  for (const src of sources) {
    if (!src) continue;
    const toolInput = (src['tool_input'] ?? src) as Record<string, unknown>;
    if (typeof toolInput !== 'object' || toolInput === null) continue;

    const path = toolInput['file_path'] ?? toolInput['path'] ?? toolInput['filePath'];
    if (typeof path === 'string') return path;
  }

  return undefined;
}

function extractToolName(incoming: IncomingEvent): string | undefined {
  if (incoming.tool) return incoming.tool;
  if (incoming.data?.['tool_name'] && typeof incoming.data['tool_name'] === 'string') {
    return incoming.data['tool_name'];
  }
  return undefined;
}

function extractDuration(data?: Record<string, unknown>): number | undefined {
  if (!data) return undefined;
  const dur = data['duration_ms'] ?? data['duration'];
  return typeof dur === 'number' ? dur : undefined;
}

function extractError(data?: Record<string, unknown>): string | undefined {
  if (!data) return undefined;
  const err = data['error_message'] ?? data['error'];
  return typeof err === 'string' ? err : undefined;
}

export function processEvent(incoming: IncomingEvent): AgentEvent {
  const now = new Date().toISOString();
  const sessionId = incoming.session_id || 'default';
  const agentId = incoming.agent_id || 'main';
  const toolName = extractToolName(incoming);
  const category = categorizeEvent(incoming.hook, toolName);

  const inputStr = incoming.data?.['tool_input'] ?? incoming.input ?? incoming.data;
  const outputStr = incoming.data?.['tool_output'] ?? incoming.data?.['output'];

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

  sseManager.broadcast('agent_event', event, sessionId);

  return event;
}

function persistEvent(event: AgentEvent, now: string): void {
  // Ensure session exists
  const existingSession = sessionQueries.getById().get(event.sessionId) as Record<string, unknown> | undefined;
  if (!existingSession) {
    const workDir = (event.metadata?.['working_directory'] as string) || process.cwd();
    sessionQueries.insert().run(
      event.sessionId,
      event.timestamp,
      workDir,
      'active',
      0,
      0,
      null
    );
  }

  sessionQueries.incrementEventCount().run(event.sessionId);

  // Ensure agent exists
  const existingAgent = agentQueries.getById().get(event.agentId, event.sessionId) as Record<string, unknown> | undefined;
  if (!existingAgent) {
    const agentName = (event.metadata?.['agent_name'] as string) || event.agentId;
    agentQueries.upsert().run(
      event.agentId,
      event.sessionId,
      agentName,
      'general-purpose',
      'active',
      event.timestamp,
      event.timestamp
    );

    const agents = agentQueries.getBySession().all(event.sessionId) as unknown[];
    sessionQueries.updateAgentCount().run(agents.length, event.sessionId);
  }

  // Update agent status
  if (event.hookType === 'PreToolUse' || event.hookType === 'PostToolUse') {
    agentQueries.incrementToolCalls().run(now, event.agentId, event.sessionId);
    agentQueries.updateStatus().run('active', now, event.agentId, event.sessionId);

    sseManager.broadcast('agent_status', {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: 'active',
    }, event.sessionId);
  }

  if (event.category === 'error') {
    agentQueries.incrementErrors().run(now, event.agentId, event.sessionId);
    agentQueries.updateStatus().run('error', now, event.agentId, event.sessionId);

    sseManager.broadcast('agent_status', {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: 'error',
    }, event.sessionId);
  }

  if (event.hookType === 'Stop') {
    agentQueries.updateStatus().run('completed', now, event.agentId, event.sessionId);
    sseManager.broadcast('agent_status', {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: 'completed',
    }, event.sessionId);

    const activeAgents = (agentQueries.getBySession().all(event.sessionId) as Array<Record<string, unknown>>)
      .filter(a => a['status'] === 'active');
    if (activeAgents.length === 0) {
      sessionQueries.updateStatus().run('completed', now, event.sessionId);
      sseManager.broadcast('session_status', {
        session: event.sessionId,
        status: 'completed',
      }, event.sessionId);
    }
  }

  if (event.hookType === 'SubagentStop') {
    agentQueries.updateStatus().run('shutdown', now, event.agentId, event.sessionId);
    sseManager.broadcast('agent_status', {
      agent: event.agentId,
      sessionId: event.sessionId,
      status: 'shutdown',
    }, event.sessionId);
  }

  // Track file changes
  if (event.filePath && event.category === 'file_change') {
    const changeType = event.tool === 'Write' ? 'created' : 'modified';
    fileChangeQueries.upsert().run(
      event.filePath,
      event.sessionId,
      event.agentId,
      changeType,
      event.timestamp,
      event.timestamp
    );
  } else if (event.filePath && (FILE_READ_TOOLS as readonly string[]).includes(event.tool || '')) {
    fileChangeQueries.upsert().run(
      event.filePath,
      event.sessionId,
      event.agentId,
      'read',
      event.timestamp,
      event.timestamp
    );
  }

  // Track task items from TaskCreate/TaskUpdate tools
  if (event.tool === 'TaskCreate' && event.metadata) {
    const subject = (event.metadata['subject'] as string) ||
                    ((event.metadata['tool_input'] as Record<string, unknown>)?.['subject'] as string) || 'Untitled Task';
    const taskId = randomUUID();
    taskItemQueries.upsert().run(
      taskId,
      event.sessionId,
      subject,
      'pending',
      null,
      event.timestamp,
      event.timestamp
    );
  }

  if (event.tool === 'TaskUpdate' && event.metadata) {
    const input = (event.metadata['tool_input'] ?? event.metadata) as Record<string, unknown>;
    const taskId = (input['taskId'] as string) || '';
    const status = input['status'] as string | undefined;
    const owner = input['owner'] as string | undefined;
    if (taskId) {
      taskItemQueries.upsert().run(
        taskId,
        event.sessionId,
        input['subject'] || 'Updated Task',
        status || 'pending',
        owner || null,
        event.timestamp,
        event.timestamp
      );
    }
  }

  // Persist the event
  eventQueries.insert().run(
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
    event.metadata ? JSON.stringify(event.metadata) : null
  );
}
