import { useEffect, useCallback } from 'react';
import { useProjectStore } from '../stores/project-store';
import { useSessionStore } from '../stores/session-store';
import * as api from '../lib/api';

export function useTasks() {
  const { activeProject, tasks, setTasks } = useProjectStore();
  const events = useSessionStore((s) => s.events);

  const fetchTasks = useCallback(async () => {
    if (!activeProject?.id) return;
    try {
      const { tasks: data } = await api.getTasks(activeProject.id);
      setTasks(data);
    } catch {
      // ignore
    }
  }, [activeProject?.id, setTasks]);

  // Initial fetch + periodic refresh (15s, as backup)
  useEffect(() => {
    if (!activeProject?.id) return;

    let cancelled = false;

    async function load() {
      try {
        const { tasks: data } = await api.getTasks(activeProject!.id);
        if (!cancelled) setTasks(data);
      } catch {
        // ignore
      }
    }

    load();
    const interval = setInterval(load, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeProject?.id, setTasks]);

  // React to SSE events: when we see task_status_changed or correlation_match
  // in the events stream, refetch tasks immediately for fresh data
  useEffect(() => {
    if (!activeProject?.id || events.length === 0) return;

    const latestEvent = events[0];
    if (!latestEvent) return;

    // If the latest event is a TaskUpdate or TaskCreate, refetch
    const isTaskTool = latestEvent.tool === 'TaskUpdate' || latestEvent.tool === 'TaskCreate';
    if (isTaskTool) {
      // Small delay to let the server process correlation
      const timer = setTimeout(fetchTasks, 300);
      return () => clearTimeout(timer);
    }
  }, [events, activeProject?.id, fetchTasks]);

  return tasks;
}
