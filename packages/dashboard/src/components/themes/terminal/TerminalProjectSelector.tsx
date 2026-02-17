import { useState, useRef, useEffect } from 'react';
import { useProjectStore, type ViewMode } from '../../../stores/project-store';

const VIEW_MODES: { id: ViewMode; label: string; key: string; description: string }[] = [
  { id: 'map', label: 'AgentMap', key: '0', description: 'Pixel art agent visualization' },
  { id: 'monitor', label: 'Monitor', key: '1', description: 'Real-time agent activity' },
  { id: 'tracker', label: 'Tracker', key: '2', description: 'PRD & sprint tracking' },
  { id: 'mission-control', label: 'MissionCtrl', key: '3', description: 'Combined view' },
];

export function TerminalProjectSelector() {
  const { viewMode, setViewMode, activeProject } = useProjectStore();
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
    <div ref={ref} className="relative font-mono text-[11px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 border border-[#1a3a1a] bg-[#0d0d0d] hover:border-[#00aa00] transition-colors"
      >
        <span className="terminal-muted">{'>'}</span>
        <span className="text-[#00ff00]">{currentMode.label}</span>
        <span className="terminal-dim">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[#0a0a0a] border border-[#1a3a1a] z-50 shadow-lg shadow-black/50">
          {/* Title */}
          <div className="px-2 py-1 border-b border-[#1a3a1a]">
            <span className="terminal-dim text-[10px]">{'## SELECT MODE ##'}</span>
          </div>

          {/* View modes */}
          <div className="p-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setViewMode(mode.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 transition-colors ${
                  viewMode === mode.id
                    ? 'bg-[#0a1f0a] text-[#00ff00] border-l-2 border-[#00ff00]'
                    : 'text-[#00aa00] hover:bg-[#0d1a0d] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="terminal-dim">[{mode.key}]</span>
                  <span className={viewMode === mode.id ? 'terminal-glow' : ''}>{mode.label}</span>
                </div>
                <div className="terminal-dim text-[9px] ml-4 mt-0.5">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>

          {/* Active project */}
          {activeProject && (
            <div className="px-2 py-1.5 border-t border-[#1a3a1a]">
              <span className="terminal-dim text-[9px]">PROJECT:</span>
              <div className="text-[#00ccff] text-[10px] mt-0.5">{activeProject.name}</div>
              <div className="flex items-center gap-1 mt-1 text-[10px]">
                <span className="terminal-dim">[</span>
                <span className="text-[#00ff00]">
                  {'\u2588'.repeat(Math.round((activeProject.completedTasks / Math.max(activeProject.totalTasks, 1)) * 10))}
                  {'\u2591'.repeat(10 - Math.round((activeProject.completedTasks / Math.max(activeProject.totalTasks, 1)) * 10))}
                </span>
                <span className="terminal-dim">]</span>
                <span className="terminal-muted ml-1">
                  {activeProject.completedTasks}/{activeProject.totalTasks}
                </span>
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="px-2 py-1 border-t border-[#1a3a1a]">
            <span className="terminal-dim text-[9px]">Ctrl+P to toggle</span>
          </div>
        </div>
      )}
    </div>
  );
}
