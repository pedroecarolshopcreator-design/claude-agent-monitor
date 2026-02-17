import type { Response } from 'express';
import { SSE_HEARTBEAT_INTERVAL_MS } from '@cam/shared';

interface SSEClient {
  id: string;
  res: Response;
  sessionFilter?: string;
  groupFilter?: string;
}

/**
 * Resolver function to get all session IDs belonging to a group.
 * Set by the server during initialization to avoid circular imports.
 */
type GroupSessionResolver = (groupId: string) => string[];

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private groupSessionResolver: GroupSessionResolver | null = null;

  /**
   * Set the resolver that maps group IDs to session IDs.
   * This avoids circular imports between sse-manager and queries.
   */
  setGroupSessionResolver(resolver: GroupSessionResolver): void {
    this.groupSessionResolver = resolver;
  }

  addClient(id: string, res: Response, sessionFilter?: string, groupFilter?: string): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res, sessionFilter, groupFilter });

    res.on('close', () => {
      this.clients.delete(id);
    });

    if (!this.heartbeatTimer) {
      this.startHeartbeat();
    }
  }

  broadcast(eventType: string, data: unknown, sessionId?: string): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of this.clients.values()) {
      if (this.shouldDeliverToClient(client, sessionId)) {
        try {
          client.res.write(payload);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * Determine if a message should be delivered to a specific client.
   * Supports both session-level and group-level filtering.
   */
  private shouldDeliverToClient(client: SSEClient, sessionId?: string): boolean {
    // No filter on client = receives everything
    if (!client.sessionFilter && !client.groupFilter) {
      return true;
    }

    // Session filter: direct match
    if (client.sessionFilter && sessionId && client.sessionFilter === sessionId) {
      return true;
    }

    // Group filter: check if sessionId belongs to the group
    if (client.groupFilter && sessionId && this.groupSessionResolver) {
      try {
        const groupSessionIds = this.groupSessionResolver(client.groupFilter);
        if (groupSessionIds.includes(sessionId)) {
          return true;
        }
      } catch {
        // If resolver fails, skip
      }
    }

    // If client has a filter but sessionId doesn't match, skip
    // (unless no sessionId was provided, in which case deliver to all)
    if (!sessionId) {
      return true;
    }

    return false;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const payload = `event: heartbeat\ndata: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        connections: this.clients.size,
      })}\n\n`;

      for (const client of this.clients.values()) {
        try {
          client.res.write(payload);
        } catch {
          this.clients.delete(client.id);
        }
      }

      if (this.clients.size === 0 && this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }, SSE_HEARTBEAT_INTERVAL_MS);
  }

  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      try {
        client.res.end();
      } catch {
        // ignore
      }
    }
    this.clients.clear();
  }
}

export const sseManager = new SSEManager();
