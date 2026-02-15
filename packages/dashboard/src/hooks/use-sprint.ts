import { useEffect } from 'react';
import { useProjectStore } from '../stores/project-store';
import * as api from '../lib/api';

export function useSprint() {
  const { activeProject, sprints, activeSprint, setSprints, setActiveSprint } = useProjectStore();

  useEffect(() => {
    if (!activeProject?.id) return;

    let cancelled = false;

    async function fetchSprints() {
      try {
        const { sprints: data } = await api.getSprints(activeProject!.id);
        if (!cancelled) {
          setSprints(data);
          if (!activeSprint && data.length > 0) {
            const active = data.find((s: any) => s.status === 'active') || data[0];
            setActiveSprint(active);
          }
        }
      } catch {
        // ignore
      }
    }

    fetchSprints();
    const interval = setInterval(fetchSprints, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeProject?.id, setSprints, setActiveSprint, activeSprint]);

  return { sprints, activeSprint };
}
