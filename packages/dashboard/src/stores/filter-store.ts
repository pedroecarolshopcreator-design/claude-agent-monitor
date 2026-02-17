import { create } from "zustand";
import type { EventCategory } from "@cam/shared";

interface FilterState {
  agentFilter: string | null;
  toolFilter: string | null;
  categoryFilter: EventCategory | null;
  searchQuery: string;
  followMode: boolean;
  hidePolling: boolean;

  setAgentFilter: (agentId: string | null) => void;
  setToolFilter: (tool: string | null) => void;
  setCategoryFilter: (category: EventCategory | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFollowMode: () => void;
  toggleHidePolling: () => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  agentFilter: null,
  toolFilter: null,
  categoryFilter: null,
  searchQuery: "",
  followMode: true,
  hidePolling: false,

  setAgentFilter: (agentFilter) => set({ agentFilter }),
  setToolFilter: (toolFilter) => set({ toolFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleFollowMode: () => set((state) => ({ followMode: !state.followMode })),
  toggleHidePolling: () =>
    set((state) => ({ hidePolling: !state.hidePolling })),
  resetFilters: () =>
    set({
      agentFilter: null,
      toolFilter: null,
      categoryFilter: null,
      searchQuery: "",
    }),
}));
