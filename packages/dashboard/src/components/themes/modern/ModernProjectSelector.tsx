import { useState, useRef, useEffect } from 'react';
import { useProjectStore, type ViewMode } from '../../../stores/project-store';
import { formatPercent } from '../../../lib/formatters';

const VIEW_MODES: { id: ViewMode; label: string; description: string }[] = [
  { id: 'map', label: 'Agent Map', description: 'Pixel art agent visualization' },
  { id: 'monitor', label: 'Monitor', description: 'Real-time agent activity' },
  { id: 'tracker', label: 'Tracker', description: 'PRD & sprint tracking' },
  { id: 'mission-control', label: 'Mission Control', description: 'Combined view' },
];

export function ModernProjectSelector() {
  const { viewMode, setViewMode, activeProject, projects } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMode = VIEW_MODES.find((m) => m.id === viewMode)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cam-surface-2 border border-cam-border hover:border-cam-border-hover transition-colors"
      >
        <span className="text-xs font-medium text-cam-text">{currentMode.label}</span>
        <svg
          className={`w-3 h-3 text-cam-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-cam-surface border border-cam-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* View Modes */}
          <div className="p-2 border-b border-cam-border/50">
            <span className="text-[9px] uppercase tracking-wider text-cam-text-muted font-medium px-2">
              View Mode
            </span>
            <div className="mt-1 space-y-0.5">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setViewMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                    viewMode === mode.id
                      ? 'bg-cam-accent/10 text-cam-accent'
                      : 'text-cam-text-secondary hover:bg-cam-surface-2'
                  }`}
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-[10px] text-cam-text-muted mt-0.5">
                    {mode.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Project */}
          {activeProject && (
            <div className="p-3">
              <span className="text-[9px] uppercase tracking-wider text-cam-text-muted font-medium">
                Active Project
              </span>
              <div className="mt-1.5 bg-cam-surface-2 rounded-md p-2">
                <div className="text-xs font-medium text-cam-text">{activeProject.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-cam-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cam-accent rounded-full transition-all"
                      style={{
                        width: formatPercent(activeProject.completedTasks, activeProject.totalTasks),
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-cam-text-muted font-mono">
                    {activeProject.completedTasks}/{activeProject.totalTasks}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <div className="px-3 py-2 border-t border-cam-border/50">
            <span className="text-[9px] text-cam-text-muted">
              Ctrl+P to toggle
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
