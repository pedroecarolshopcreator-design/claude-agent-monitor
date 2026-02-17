import type { AgentZone, AgentMapPosition } from '@cam/shared';
import { ZoneCard } from './ZoneCard';
import { AgentSprite } from './AgentSprite';

const ZONE_ORDER: AgentZone[] = [
  'library', 'workshop', 'terminal', 'research',
  'comms',   'taskboard', 'rest',    'done',
];

interface AgentMapGridProps {
  positions: Map<string, AgentMapPosition>;
  agentNames: Map<string, string>;
  agentColors: Map<string, string>;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

export function AgentMapGrid({
  positions,
  agentNames,
  agentColors,
  selectedAgentId,
  onSelectAgent,
}: AgentMapGridProps) {
  const agentsByZone = new Map<AgentZone, AgentMapPosition[]>();
  for (const zone of ZONE_ORDER) {
    agentsByZone.set(zone, []);
  }
  for (const pos of positions.values()) {
    const list = agentsByZone.get(pos.zone);
    if (list) {
      list.push(pos);
    }
  }

  return (
    <div className="agent-map-grid grid grid-cols-4 gap-2 p-3 h-full auto-rows-fr">
      {ZONE_ORDER.map((zone) => {
        const agents = agentsByZone.get(zone) ?? [];
        return (
          <ZoneCard key={zone} zone={zone} agentCount={agents.length}>
            {agents.map((pos) => (
              <AgentSprite
                key={pos.agentId}
                agentId={pos.agentId}
                name={agentNames.get(pos.agentId) ?? pos.agentId}
                color={agentColors.get(pos.agentId) ?? '#8b5cf6'}
                animationState={pos.animationState}
                lastTool={pos.lastTool}
                activityLabel={pos.activityLabel}
                isSelected={selectedAgentId === pos.agentId}
                onClick={() => onSelectAgent(pos.agentId)}
              />
            ))}
          </ZoneCard>
        );
      })}
    </div>
  );
}
