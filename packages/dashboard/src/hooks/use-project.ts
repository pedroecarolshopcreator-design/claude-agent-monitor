import { useEffect } from 'react';
import { useProjectStore } from '../stores/project-store';
import * as api from '../lib/api';

export function useProject() {
  const { projects, activeProject, setProjects, setActiveProject } = useProjectStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        const { projects: data } = await api.getProjects();
        if (!cancelled) {
          setProjects(data);
          if (!activeProject && data.length > 0) {
            setActiveProject(data[0]);
          }
        }
      } catch {
        // ignore
      }
    }

    fetchProjects();
    const interval = setInterval(fetchProjects, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setProjects, setActiveProject, activeProject]);

  return { projects, activeProject };
}
