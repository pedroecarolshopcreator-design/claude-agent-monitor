export interface FileChange {
  filePath: string;
  sessionId: string;
  agentId: string;
  changeType: FileChangeType;
  firstTouchedAt: string;
  lastTouchedAt: string;
  touchCount: number;
}

export type FileChangeType = 'created' | 'modified' | 'read';
