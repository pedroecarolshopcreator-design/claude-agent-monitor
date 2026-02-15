export interface Agent {
  id: string;
  sessionId: string;
  name: string;
  type: string;
  status: AgentStatus;
  firstSeenAt: string;
  lastActivityAt: string;
  currentTask?: string;
  toolCallCount: number;
  errorCount: number;
}

export type AgentStatus =
  | 'active'
  | 'idle'
  | 'error'
  | 'completed'
  | 'shutdown';
