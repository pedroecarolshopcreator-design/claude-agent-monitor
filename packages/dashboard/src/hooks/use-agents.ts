import { useEffect } from 'react';
import { useSessionStore } from '../stores/session-store';
import * as api from '../lib/api';

export function useAgents() {
  const { session, agents, setAgents } = useSessionStore();

  useEffect(() => {
    if (!session?.id) return;

    let cancelled = false;

    async function fetchAgents() {
      try {
        const { agents: data } = await api.getAgents(session!.id);
        if (!cancelled) setAgents(data);
      } catch {
        // ignore
      }
    }

    fetchAgents();
    const interval = setInterval(fetchAgents, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.id, setAgents]);

  return agents;
}
