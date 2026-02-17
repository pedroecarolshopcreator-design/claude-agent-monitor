import { useProjectStore } from '../../../stores/project-store';

export function TerminalProjectSelector() {
  const { viewMode, setViewMode, activeProject } = useProjectStore();

  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <button
        onClick={() => setViewMode('agents')}
        className={`px-2 py-0.5 transition-colors ${
          viewMode === 'agents'
            ? 'text-[#00ff00] terminal-glow bg-[#0a1f0a]'
            : 'terminal-muted hover:text-[#00aa00]'
        }`}
      >
        [AGENTS]
      </button>
      <button
        onClick={() => setViewMode('tracker')}
        className={`px-2 py-0.5 transition-colors ${
          viewMode === 'tracker'
            ? 'text-[#00ff00] terminal-glow bg-[#0a1f0a]'
            : 'terminal-muted hover:text-[#00aa00]'
        }`}
      >
        [TRACKER]
      </button>
      {activeProject && (
        <span className="terminal-muted">
          {activeProject.completedTasks}/{activeProject.totalTasks}
        </span>
      )}
    </div>
  );
}
