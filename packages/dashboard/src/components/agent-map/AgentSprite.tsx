import { memo } from 'react';
import type { AgentAnimationState } from '@cam/shared';
import { PixelCharacter } from './PixelCharacter';
import { useAgentMapStore } from '../../stores/agent-map-store';

interface AgentSpriteProps {
  agentId: string;
  name: string;
  color: string;
  animationState: AgentAnimationState;
  lastTool: string | null;
  activityLabel: string | null;
  isSelected: boolean;
  onClick: () => void;
}

function AgentSpriteInner({
  name,
  color,
  animationState,
  activityLabel,
  isSelected,
  onClick,
}: AgentSpriteProps) {
  const showLabels = useAgentMapStore((s) => s.showLabels);

  return (
    <div
      className={`pixel-character-container sprite-anim-${animationState} ${isSelected ? 'selected' : ''} agent-spawn`}
      style={{ color }}
      onClick={onClick}
      title={`${name} (${animationState})${activityLabel ? ` - ${activityLabel}` : ''}`}
    >
      {/* Pixel art character */}
      <PixelCharacter
        color={color}
        animationState={animationState}
        pixelSize={2}
      />

      {/* Animation overlays */}
      {animationState === 'working' && (
        <div className="working-particles" style={{ color }}>
          <div className="working-particle" />
          <div className="working-particle" />
          <div className="working-particle" />
        </div>
      )}

      {animationState === 'error' && (
        <div className="error-indicator" style={{ color: '#ef4444' }}>!</div>
      )}

      {animationState === 'completed' && (
        <div className="confetti-container">
          <div className="confetti-piece" />
          <div className="confetti-piece" />
          <div className="confetti-piece" />
          <div className="confetti-piece" />
        </div>
      )}

      {animationState === 'shutdown' && (
        <div className="zzz-container">
          <span className="zzz-letter">z</span>
          <span className="zzz-letter">Z</span>
          <span className="zzz-letter">z</span>
        </div>
      )}

      {/* Name tag */}
      {showLabels && (
        <span className="agent-name-tag" style={{ color }}>
          {name}
        </span>
      )}

      {/* Activity label */}
      {showLabels && activityLabel && (
        <span className="agent-activity-label">
          {activityLabel}
        </span>
      )}
    </div>
  );
}

export const AgentSprite = memo(AgentSpriteInner, (prev, next) => {
  return (
    prev.agentId === next.agentId &&
    prev.animationState === next.animationState &&
    prev.activityLabel === next.activityLabel &&
    prev.isSelected === next.isSelected &&
    prev.color === next.color &&
    prev.name === next.name
  );
});
