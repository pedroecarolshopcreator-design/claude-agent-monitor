import { useEffect, useRef } from 'react';
import { SSEClient } from '../lib/sse';
import { useSessionStore } from '../stores/session-store';
import { useProjectStore } from '../stores/project-store';
import type { AgentEvent, Agent } from '@cam/shared';

export function useSSE(sessionId?: string) {
  const clientRef = useRef<SSEClient | null>(null);
  const { addEvent, addAgent, updateAgent, setConnected, setLastHeartbeat } = useSessionStore();
  const { updateTask } = useProjectStore();

  useEffect(() => {
    const client = new SSEClient({
      url: '/api/stream',
      sessionId,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onEvent: (data: AgentEvent) => {
        addEvent(data);
        if (data.agentId) {
          addAgent({
            id: data.agentId,
            sessionId: data.sessionId,
            name: data.agentId,
            type: 'agent',
            status: 'active',
            firstSeenAt: data.timestamp,
            lastActivityAt: data.timestamp,
            toolCallCount: 0,
            errorCount: 0,
          });
        }
      },
      onAgentStatus: (data: { agent: string; status: Agent['status'] }) => {
        updateAgent(data.agent, { status: data.status });
      },
      onTaskStatusChanged: (data: { taskId: string; newStatus: string }) => {
        updateTask(data.taskId, { status: data.newStatus as any });
      },
      onHeartbeat: (data: { timestamp: string }) => {
        setLastHeartbeat(data.timestamp);
      },
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [sessionId, addEvent, addAgent, updateAgent, setConnected, setLastHeartbeat, updateTask]);

  return clientRef.current;
}
