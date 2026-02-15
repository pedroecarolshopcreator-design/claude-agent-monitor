import type { Response } from 'express';
import { SSE_HEARTBEAT_INTERVAL_MS } from '@cam/shared';

interface SSEClient {
  id: string;
  res: Response;
  sessionFilter?: string;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  addClient(id: string, res: Response, sessionFilter?: string): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res, sessionFilter });

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
      if (client.sessionFilter && sessionId && client.sessionFilter !== sessionId) {
        continue;
      }
      try {
        client.res.write(payload);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
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
