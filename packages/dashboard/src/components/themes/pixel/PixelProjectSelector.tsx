import { useProjectStore } from '../../../stores/project-store';

export function PixelProjectSelector() {
  const { viewMode, setViewMode, activeProject } = useProjectStore();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode('agents')}
          className="pixel-text-xs px-2 py-1 transition-colors"
          style={{
            color: viewMode === 'agents' ? 'var(--pixel-gold)' : 'var(--pixel-text-muted)',
            border: viewMode === 'agents' ? '2px solid var(--pixel-gold)' : '2px solid var(--pixel-border)',
          }}
        >
          [A] AGENTS
        </button>
        <button
          onClick={() => setViewMode('tracker')}
          className="pixel-text-xs px-2 py-1 transition-colors"
          style={{
            color: viewMode === 'tracker' ? 'var(--pixel-gold)' : 'var(--pixel-text-muted)',
            border: viewMode === 'tracker' ? '2px solid var(--pixel-gold)' : '2px solid var(--pixel-border)',
          }}
        >
          [T] TRACKER
        </button>
      </div>
      {activeProject && (
        <span className="pixel-text-xs" style={{ color: 'var(--pixel-text-muted)' }}>
          {activeProject.completedTasks}/{activeProject.totalTasks}
        </span>
      )}
    </div>
  );
}
