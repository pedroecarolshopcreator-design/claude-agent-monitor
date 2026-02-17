import { useProjectStore } from '../../../stores/project-store';
import { formatPercent } from '../../../lib/formatters';

export function ModernProjectSelector() {
  const { viewMode, setViewMode, activeProject } = useProjectStore();

  return (
    <div className="flex items-center gap-2">
      {/* View tabs */}
      <div className="flex items-center bg-cam-surface-2 rounded-lg border border-cam-border/50 overflow-hidden">
        <button
          onClick={() => setViewMode('agents')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            viewMode === 'agents'
              ? 'bg-cam-accent/15 text-cam-accent'
              : 'text-cam-text-muted hover:text-cam-text'
          }`}
        >
          Agents
        </button>
        <button
          onClick={() => setViewMode('tracker')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            viewMode === 'tracker'
              ? 'bg-cam-accent/15 text-cam-accent'
              : 'text-cam-text-muted hover:text-cam-text'
          }`}
        >
          Tracker
        </button>
      </div>

      {/* Progress indicator */}
      {activeProject && (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 bg-cam-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-cam-accent rounded-full"
              style={{ width: formatPercent(activeProject.completedTasks, activeProject.totalTasks) }}
            />
          </div>
          <span className="text-[10px] text-cam-text-muted font-mono">
            {activeProject.completedTasks}/{activeProject.totalTasks}
          </span>
        </div>
      )}
    </div>
  );
}
