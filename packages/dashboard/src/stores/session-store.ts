import { create } from 'zustand';
import type { Session, Agent, AgentEvent } from '@cam/shared';

interface SessionState {
  session: Session | null;
  agents: Agent[];
  events: AgentEvent[];
  selectedAgentId: string | null;
  isConnected: boolean;
  lastHeartbeat: string | null;

  setSession: (session: Session | null) => void;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  setEvents: (events: AgentEvent[]) => void;
  addEvent: (event: AgentEvent) => void;
  selectAgent: (agentId: string | null) => void;
  setConnected: (connected: boolean) => void;
  setLastHeartbeat: (timestamp: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  agents: [],
  events: [],
  selectedAgentId: null,
  isConnected: false,
  lastHeartbeat: null,

  setSession: (session) => set({ session }),

  setAgents: (agents) => set({ agents }),

  addAgent: (agent) =>
    set((state) => {
      const exists = state.agents.find((a) => a.id === agent.id);
      if (exists) {
        return {
          agents: state.agents.map((a) => (a.id === agent.id ? agent : a)),
        };
      }
      return { agents: [...state.agents, agent] };
    }),

  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, ...updates } : a
      ),
    })),

  setEvents: (events) => set({ events }),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 500),
    })),

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),

  setConnected: (isConnected) => set({ isConnected }),

  setLastHeartbeat: (lastHeartbeat) => set({ lastHeartbeat }),

  reset: () =>
    set({
      session: null,
      agents: [],
      events: [],
      selectedAgentId: null,
      isConnected: false,
      lastHeartbeat: null,
    }),
}));
