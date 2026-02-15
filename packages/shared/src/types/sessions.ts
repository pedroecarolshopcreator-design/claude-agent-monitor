export interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  workingDirectory: string;
  status: SessionStatus;
  agentCount: number;
  eventCount: number;
  metadata?: Record<string, unknown>;
}

export type SessionStatus = 'active' | 'completed' | 'error';
