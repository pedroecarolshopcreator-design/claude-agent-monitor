import { create } from 'zustand';
import type { Project, Sprint, PRDTask } from '@cam/shared';

export type ViewMode = 'monitor' | 'tracker' | 'mission-control';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  activeSprint: Sprint | null;
  sprints: Sprint[];
  tasks: PRDTask[];
  viewMode: ViewMode;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setActiveSprint: (sprint: Sprint | null) => void;
  setSprints: (sprints: Sprint[]) => void;
  setTasks: (tasks: PRDTask[]) => void;
  updateTask: (taskId: string, updates: Partial<PRDTask>) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  activeSprint: null,
  sprints: [],
  tasks: [],
  viewMode: 'monitor',

  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setActiveSprint: (activeSprint) => set({ activeSprint }),
  setSprints: (sprints) => set({ sprints }),
  setTasks: (tasks) => set({ tasks }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  setViewMode: (viewMode) => set({ viewMode }),
}));
