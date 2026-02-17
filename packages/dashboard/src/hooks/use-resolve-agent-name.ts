import { useMemo, useCallback } from "react";
import { useSessionStore } from "../stores/session-store.js";
import { getAgentDisplayName } from "../lib/friendly-names.js";

/**
 * Hook that resolves agent UUIDs to human-readable display names.
 *
 * Uses the agents array from the session store to look up the agent by ID.
 * Falls back to the first 8 characters of the UUID if the agent is not found.
 *
 * @returns A function `resolveAgentName(agentId: string) => string`
 */
export function useResolveAgentName(): (agentId: string) => string {
  const agents = useSessionStore((s) => s.agents);

  const agentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      map.set(agent.id, getAgentDisplayName(agent.id, agent.name));
    }
    return map;
  }, [agents]);

  const resolveAgentName = useCallback(
    (agentId: string): string => {
      const found = agentNameMap.get(agentId);
      if (found) return found;

      // Fallback: first 8 chars of UUID
      return agentId.slice(0, 8);
    },
    [agentNameMap],
  );

  return resolveAgentName;
}
