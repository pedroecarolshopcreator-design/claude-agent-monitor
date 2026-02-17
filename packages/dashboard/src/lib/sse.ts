export type SSEEventHandler = (data: any) => void;

export interface SSEClientOptions {
  url: string;
  sessionId?: string;
  groupId?: string;
  onEvent?: SSEEventHandler;
  onAgentStatus?: SSEEventHandler;
  onSessionStatus?: SSEEventHandler;
  onTaskStatusChanged?: SSEEventHandler;
  onTaskAssigned?: SSEEventHandler;
  onSprintProgress?: SSEEventHandler;
  onProjectProgress?: SSEEventHandler;
  onTaskBlocked?: SSEEventHandler;
  onTaskUnblocked?: SSEEventHandler;
  onCorrelationMatch?: SSEEventHandler;
  onAgentCreated?: SSEEventHandler;
  onTeamCreated?: SSEEventHandler;
  onSessionGroupCreated?: SSEEventHandler;
  onSessionGroupMemberAdded?: SSEEventHandler;
  onSessionGroupCompleted?: SSEEventHandler;
  onHeartbeat?: SSEEventHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
}

export class SSEClient {
  private source: EventSource | null = null;
  private options: SSEClientOptions;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(options: SSEClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.source) this.disconnect();

    const url = new URL(this.options.url, window.location.origin);
    // Prefer group_id over session_id when available (multi-agent teams)
    if (this.options.groupId) {
      url.searchParams.set('group_id', this.options.groupId);
    } else if (this.options.sessionId) {
      url.searchParams.set('session_id', this.options.sessionId);
    }

    this.source = new EventSource(url.toString());

    this.source.onopen = () => {
      this.options.onConnect?.();
    };

    this.source.onerror = (e) => {
      this.options.onError?.(e);
      this.options.onDisconnect?.();
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.addListener('agent_event', this.options.onEvent);
    this.addListener('agent_status', this.options.onAgentStatus);
    this.addListener('session_status', this.options.onSessionStatus);
    this.addListener('task_status_changed', this.options.onTaskStatusChanged);
    this.addListener('task_assigned', this.options.onTaskAssigned);
    this.addListener('sprint_progress', this.options.onSprintProgress);
    this.addListener('project_progress', this.options.onProjectProgress);
    this.addListener('task_blocked', this.options.onTaskBlocked);
    this.addListener('task_unblocked', this.options.onTaskUnblocked);
    this.addListener('correlation_match', this.options.onCorrelationMatch);
    this.addListener('agent_created', this.options.onAgentCreated);
    this.addListener('team_created', this.options.onTeamCreated);
    this.addListener('session_group_created', this.options.onSessionGroupCreated);
    this.addListener('session_group_member_added', this.options.onSessionGroupMemberAdded);
    this.addListener('session_group_completed', this.options.onSessionGroupCompleted);
    this.addListener('heartbeat', this.options.onHeartbeat);
  }

  private addListener(eventType: string, handler?: SSEEventHandler): void {
    if (!this.source || !handler) return;
    this.source.addEventListener(eventType, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handler(data);
      } catch {
        // ignore parse errors
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectDelay ?? 3000);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.source) {
      this.source.close();
      this.source = null;
    }
  }

  reconnect(): void {
    this.shouldReconnect = true;
    this.connect();
  }
}
