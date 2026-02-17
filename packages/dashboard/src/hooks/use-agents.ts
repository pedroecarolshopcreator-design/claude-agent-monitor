import { useEffect } from 'react';
import { useSessionStore } from '../stores/session-store';
import * as api from '../lib/api';

export function useAgents() {
  const { session, groupId, agents, setAgents } = useSessionStore();

  useEffect(() => {
    if (!session?.id && !groupId) return;

    let cancelled = false;

    async function fetchAgents() {
      try {
        // Prefer group agents when a session group is active
        if (groupId) {
          const { agents: data } = await api.fetchSessionGroupAgents(groupId);
          if (!cancelled) setAgents(data);
        } else if (session?.id) {
          const { agents: data } = await api.getAgents(session.id);
          if (!cancelled) setAgents(data);
        }
      } catch {
        // ignore
      }
    }

    fetchAgents();
    const interval = setInterval(fetchAgents, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.id, groupId, setAgents]);

  return agents;
}
