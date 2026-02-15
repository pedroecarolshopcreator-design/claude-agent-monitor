import { useEffect } from 'react';
import { useProjectStore } from '../stores/project-store';
import * as api from '../lib/api';

export function useTasks() {
  const { activeProject, tasks, setTasks } = useProjectStore();

  useEffect(() => {
    if (!activeProject?.id) return;

    let cancelled = false;

    async function fetchTasks() {
      try {
        const { tasks: data } = await api.getTasks(activeProject!.id);
        if (!cancelled) setTasks(data);
      } catch {
        // ignore
      }
    }

    fetchTasks();
    const interval = setInterval(fetchTasks, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeProject?.id, setTasks]);

  return tasks;
}
