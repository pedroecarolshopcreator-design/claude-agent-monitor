export interface AgentEvent {
  id: string;
  sessionId: string;
  agentId: string;
  timestamp: string;
  hookType: HookType;
  category: EventCategory;
  tool?: string;
  filePath?: string;
  input?: string;
  output?: string;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export type HookType =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'PreCompact'
  | 'PostCompact'
  | 'PreToolUseRejected'
  | 'ToolError'
  | 'SessionStart';

export type EventCategory =
  | 'tool_call'
  | 'file_change'
  | 'command'
  | 'message'
  | 'lifecycle'
  | 'error'
  | 'compact'
  | 'notification';
