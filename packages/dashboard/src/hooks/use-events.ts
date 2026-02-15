import { useEffect } from 'react';
import { useSessionStore } from '../stores/session-store';
import { useFilterStore } from '../stores/filter-store';
import * as api from '../lib/api';

export function useEvents() {
  const { session, events, setEvents } = useSessionStore();
  const { agentFilter, toolFilter, categoryFilter } = useFilterStore();

  useEffect(() => {
    if (!session?.id) return;

    let cancelled = false;

    async function fetchEvents() {
      try {
        const { events: data } = await api.getEvents(session!.id, {
          agent_id: agentFilter ?? undefined,
          tool: toolFilter ?? undefined,
          category: categoryFilter ?? undefined,
          limit: 200,
        });
        if (!cancelled) setEvents(data);
      } catch {
        // ignore
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [session?.id, agentFilter, toolFilter, categoryFilter, setEvents]);

  return events;
}
