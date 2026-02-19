import type { AgentLayout3D } from './use-agent-layout.js';

interface InactiveBar3DProps {
  /** Inactive agents to display */
  agents: AgentLayout3D[];
  /** Currently selected agent ID (for highlight) */
  selectedAgentId: string | null;
  /** Callback when an agent is clicked */
  onSelectAgent: (agentId: string) => void;
}

/**
 * HTML bar for inactive agents, rendered OUTSIDE the R3F Canvas.
 *
 * Displays inactive (idle/completed/shutdown) agents as compact mini-cards
 * in a horizontal row at the bottom of the Agent Map.
 *
 * Each mini-card shows a colored circle with the agent's initial, their name,
 * and a status indicator.
 */
export function InactiveBar3D({
  agents,
  selectedAgentId,
  onSelectAgent,
}: InactiveBar3DProps) {
  if (agents.length === 0) return null;

  return (
    <div className="flex gap-2 p-2 bg-[#0a0a12]/80 border-t border-white/5 items-center overflow-x-auto shrink-0">
      {/* Count label */}
      <span className="text-zinc-600 text-xs font-mono whitespace-nowrap shrink-0">
        {agents.length === 1 ? '1 inactive' : `${agents.length} inactive`}
      </span>

      {/* Agent mini-cards */}
      {agents.map((agent) => {
        const isSelected = selectedAgentId === agent.agentId;
        const initial = agent.name.charAt(0).toUpperCase();

        return (
          <button
            key={agent.agentId}
            type="button"
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded
              transition-all duration-150 cursor-pointer
              hover:bg-white/5
              ${isSelected ? 'bg-white/10 ring-1' : 'opacity-50 hover:opacity-80'}
            `}
            style={{
              outlineColor: isSelected ? agent.color : undefined,
              outlineWidth: isSelected ? '1px' : undefined,
              outlineStyle: isSelected ? 'solid' : undefined,
            }}
            onClick={() => onSelectAgent(agent.agentId)}
            title={`${agent.name} (${agent.animationState})`}
          >
            {/* Colored circle with initial */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
              style={{
                backgroundColor: `${agent.color}30`,
                color: agent.color,
                border: `1px solid ${agent.color}50`,
              }}
            >
              {initial}
            </div>

            {/* Agent name */}
            <span
              className="text-xs font-mono truncate max-w-[80px]"
              style={{ color: agent.color }}
            >
              {agent.name}
            </span>

            {/* Status dot */}
            <StatusDot animationState={agent.animationState} />
          </button>
        );
      })}
    </div>
  );
}

/** Small colored dot indicating agent status */
function StatusDot({ animationState }: { animationState: string }) {
  let dotColor: string;

  switch (animationState) {
    case 'completed':
      dotColor = '#22c55e'; // green
      break;
    case 'shutdown':
      dotColor = '#6b7280'; // gray
      break;
    case 'error':
      dotColor = '#ef4444'; // red
      break;
    default:
      dotColor = '#fbbf24'; // yellow for idle
      break;
  }

  return (
    <div
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: dotColor }}
    />
  );
}
