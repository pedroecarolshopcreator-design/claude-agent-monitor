export interface TaskItem {
  id: string;
  sessionId: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  prdTaskId: string;
  eventId: string;
  sessionId: string;
  agentId: string;
  activityType: TaskActivityType;
  timestamp: string;
  details?: string;
}

export type TaskActivityType =
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_blocked'
  | 'task_unblocked'
  | 'agent_assigned'
  | 'file_modified'
  | 'error_occurred'
  | 'manual_update';
