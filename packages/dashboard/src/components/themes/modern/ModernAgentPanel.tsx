import { useSessionStore } from "../../../stores/session-store";
import { useAgents } from "../../../hooks/use-agents";
import {
  formatRelativeTime,
  getStatusDotColor,
  generateIdenticon,
} from "../../../lib/formatters";
import { getAgentDisplayName } from "../../../lib/friendly-names.js";
import type { Agent } from "@cam/shared";

export function ModernAgentPanel() {
  const agents = useAgents();
  const { selectedAgentId, selectAgent } = useSessionStore();

  if (agents.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-center">
        <div className="w-10 h-10 rounded-full bg-cam-surface-2 border border-cam-border flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-cam-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-xs text-cam-text-muted">Waiting for agents...</p>
        <p className="text-[10px] text-cam-text-muted mt-1">
          Agents will appear when Claude Code starts
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="px-2 py-1.5 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          Agents ({agents.length})
        </span>
      </div>

      <div className="space-y-0.5">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={selectedAgentId === agent.id}
            onSelect={() =>
              selectAgent(selectedAgentId === agent.id ? null : agent.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const displayName = getAgentDisplayName(agent.id, agent.name);
  const identiconColor = generateIdenticon(agent.name);

  return (
    <button
      onClick={onSelect}
      title={`${agent.name} (${agent.id})`}
      className={`
        w-full text-left rounded-lg p-2.5 transition-all duration-150
        ${
          isSelected
            ? "bg-cam-accent/10 border border-cam-accent/30"
            : "hover:bg-cam-surface-2 border border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: `${identiconColor}20`,
            color: identiconColor,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotColor(agent.status)} ${agent.status === "active" ? "animate-pulse-dot" : ""}`}
            />
            <span className="text-xs font-medium text-cam-text truncate">
              {displayName}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-cam-text-muted">
              {agent.toolCallCount} calls
            </span>
            {agent.errorCount > 0 && (
              <span className="text-[10px] text-cam-error">
                {agent.errorCount} err
              </span>
            )}
          </div>
        </div>

        <span className="text-[10px] text-cam-text-muted shrink-0">
          {formatRelativeTime(agent.lastActivityAt)}
        </span>
      </div>
    </button>
  );
}
