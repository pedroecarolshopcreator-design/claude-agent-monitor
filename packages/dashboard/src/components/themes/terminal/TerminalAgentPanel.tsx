import { useSessionStore } from "../../../stores/session-store";
import { useAgents } from "../../../hooks/use-agents";
import { formatRelativeTime } from "../../../lib/formatters";
import { getAgentDisplayName } from "../../../lib/friendly-names.js";
import type { Agent } from "@cam/shared";

const STATUS_CHARS: Record<string, string> = {
  active: "[*]",
  idle: "[-]",
  error: "[!]",
  completed: "[+]",
  shutdown: "[x]",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-[#00ff00]",
  idle: "text-[#ffaa00]",
  error: "text-[#ff3333]",
  completed: "text-[#00ccff]",
  shutdown: "text-[#006600]",
};

export function TerminalAgentPanel() {
  const agents = useAgents();
  const { selectedAgentId, selectAgent } = useSessionStore();

  if (agents.length === 0) {
    return (
      <div className="p-3 font-mono text-[11px]">
        <div className="terminal-muted mb-2">{"## AGENTS ##"}</div>
        <div className="terminal-dim">
          <p>{"> Waiting for agents..."}</p>
          <p className="mt-1 terminal-cursor">{"> "}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 font-mono text-[11px]">
      <div className="terminal-muted mb-1 px-1">
        {"## AGENTS (" + agents.length + ") ##"}
      </div>
      <div className="border-t border-[#1a3a1a] mb-1" />

      <div className="space-y-0.5">
        {agents.map((agent) => (
          <AgentRow
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

function AgentRow({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const displayName = getAgentDisplayName(agent.id, agent.name);
  const statusChar = STATUS_CHARS[agent.status] || "[ ]";
  const statusColor = STATUS_COLORS[agent.status] || "terminal-dim";

  return (
    <button
      onClick={onSelect}
      title={`${agent.name} (${agent.id})`}
      className={`
        w-full text-left px-1 py-1 font-mono text-[11px] transition-colors
        ${
          isSelected
            ? "bg-[#0a1f0a] border-l-2 border-[#00ff00]"
            : "hover:bg-[#0d1a0d] border-l-2 border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-1">
        <span
          className={`${statusColor} shrink-0 ${agent.status === "active" ? "terminal-glow" : ""}`}
        >
          {statusChar}
        </span>
        <span
          className={`truncate ${isSelected ? "text-[#00ff00] terminal-glow" : "text-[#00cc00]"}`}
        >
          {displayName}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-4 mt-0.5">
        <span className="terminal-dim">calls:{agent.toolCallCount}</span>
        {agent.errorCount > 0 && (
          <span className="terminal-error">err:{agent.errorCount}</span>
        )}
        <span className="terminal-dim ml-auto">
          {formatRelativeTime(agent.lastActivityAt)}
        </span>
      </div>
    </button>
  );
}
