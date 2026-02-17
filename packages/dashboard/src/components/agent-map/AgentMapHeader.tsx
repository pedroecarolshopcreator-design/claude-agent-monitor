import { useAgentMapStore } from '../../stores/agent-map-store';

export function AgentMapHeader() {
  const { showLabels, showInteractions, toggleLabels, toggleInteractions, positions, displayMode, setDisplayMode } =
    useAgentMapStore();

  const agentCount = positions.size;

  return (
    <div className="agent-map-header">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-cam-text tracking-tight">Agent Map</span>
        <span className="text-[10px] text-cam-text-muted font-mono">
          {agentCount} agent{agentCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleLabels}
          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
            showLabels
              ? 'border-cam-accent/40 text-cam-accent bg-cam-accent/10'
              : 'border-cam-border text-cam-text-muted hover:text-cam-text'
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => setDisplayMode(displayMode === 'technical' ? 'didactic' : 'technical')}
          className="text-[10px] px-2 py-0.5 rounded border transition-colors border-cam-accent/40 text-cam-accent bg-cam-accent/10"
        >
          {displayMode === 'technical' ? 'Technical' : 'Didactic'}
        </button>
        <button
          onClick={toggleInteractions}
          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
            showInteractions
              ? 'border-cam-accent/40 text-cam-accent bg-cam-accent/10'
              : 'border-cam-border text-cam-text-muted hover:text-cam-text'
          }`}
        >
          Lines
        </button>
      </div>
    </div>
  );
}
