import { create } from 'zustand';
import type { EventCategory } from '@cam/shared';

interface FilterState {
  agentFilter: string | null;
  toolFilter: string | null;
  categoryFilter: EventCategory | null;
  searchQuery: string;
  followMode: boolean;

  setAgentFilter: (agentId: string | null) => void;
  setToolFilter: (tool: string | null) => void;
  setCategoryFilter: (category: EventCategory | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFollowMode: () => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  agentFilter: null,
  toolFilter: null,
  categoryFilter: null,
  searchQuery: '',
  followMode: true,

  setAgentFilter: (agentFilter) => set({ agentFilter }),
  setToolFilter: (toolFilter) => set({ toolFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleFollowMode: () => set((state) => ({ followMode: !state.followMode })),
  resetFilters: () =>
    set({
      agentFilter: null,
      toolFilter: null,
      categoryFilter: null,
      searchQuery: '',
    }),
}));
