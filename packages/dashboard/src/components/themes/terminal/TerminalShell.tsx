import { useProjectStore, type ViewMode } from '../../../stores/project-store';
import { useSessionStore } from '../../../stores/session-store';
import { TerminalStatsBar } from './TerminalStatsBar';
import { TerminalAgentPanel } from './TerminalAgentPanel';
import { TerminalActivityFeed } from './TerminalActivityFeed';
import { TerminalAgentDetail } from './TerminalAgentDetail';
import { TerminalTimeline } from './TerminalTimeline';
import { TerminalFileWatcher } from './TerminalFileWatcher';
import { TerminalKanban } from './TerminalKanban';
import { TerminalSprintProgress } from './TerminalSprintProgress';
import { TerminalBurndown } from './TerminalBurndown';
import { TerminalPRDOverview } from './TerminalPRDOverview';
import { TerminalDependencyGraph } from './TerminalDependencyGraph';
import { TerminalProjectSelector } from './TerminalProjectSelector';
import { ThemeSwitcher } from '../../layout/ThemeSwitcher';
import './terminal.css';

export function TerminalShell() {
  const { viewMode } = useProjectStore();
  const { isConnected } = useSessionStore();

  return (
    <div className="h-screen w-screen flex flex-col terminal-bg terminal-boot overflow-hidden">
      {/* Top Bar - terminal header */}
      <header className="h-10 flex items-center justify-between px-3 border-b border-[#1a3a1a] bg-[#0d0d0d] shrink-0 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-[#00ff00] terminal-glow font-bold">
            {'CAM://'}
          </span>
          <span className="text-[#00aa00]">Claude Agent Monitor</span>
          <span className="terminal-dim">|</span>
          <div className="flex items-center gap-1">
            <span className={isConnected ? 'text-[#00ff00] terminal-glow' : 'terminal-error'}>
              {isConnected ? '[CONNECTED]' : '[DISCONNECTED]'}
            </span>
            {isConnected && <span className="terminal-cursor-active" />}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TerminalProjectSelector />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Stats Bar */}
      <TerminalStatsBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'monitor' && <MonitorLayout />}
        {viewMode === 'tracker' && <TrackerLayout />}
        {viewMode === 'mission-control' && <MissionControlLayout />}
      </div>

      {/* Bottom Timeline */}
      <TerminalTimeline />
    </div>
  );
}

function MonitorLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <>
      {/* Left Sidebar - Agent Panel */}
      <aside className="w-56 border-r border-[#1a3a1a] overflow-y-auto terminal-scrollbar shrink-0">
        <TerminalAgentPanel />
      </aside>

      {/* Center - Activity Feed */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <TerminalActivityFeed />
      </main>

      {/* Right Panel - Agent Detail or File Watcher */}
      <aside className="w-72 border-l border-[#1a3a1a] overflow-y-auto terminal-scrollbar shrink-0">
        {selectedAgentId ? <TerminalAgentDetail /> : <TerminalFileWatcher />}
      </aside>
    </>
  );
}

function TrackerLayout() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Main Kanban */}
        <main className="flex-1 overflow-hidden">
          <TerminalKanban />
        </main>

        {/* Right sidebar - Sprint Progress + Burndown */}
        <aside className="w-80 border-l border-[#1a3a1a] overflow-y-auto terminal-scrollbar shrink-0 flex flex-col">
          <TerminalSprintProgress />
          <TerminalBurndown />
          <TerminalDependencyGraph />
        </aside>
      </div>

      {/* Bottom - PRD Overview */}
      <div className="h-48 border-t border-[#1a3a1a] overflow-y-auto terminal-scrollbar shrink-0">
        <TerminalPRDOverview />
      </div>
    </div>
  );
}

function MissionControlLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left - Agent Monitor */}
      <div className="w-1/2 flex border-r border-[#1a3a1a] overflow-hidden">
        <aside className="w-48 border-r border-[#1a3a1a] overflow-y-auto terminal-scrollbar shrink-0">
          <TerminalAgentPanel />
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TerminalActivityFeed />
          </div>
        </div>
      </div>

      {/* Right - PRD Tracker */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex">
          <main className="flex-1 overflow-hidden">
            <TerminalKanban />
          </main>
        </div>
        <div className="h-32 border-t border-[#1a3a1a] flex shrink-0">
          <div className="flex-1">
            <TerminalSprintProgress />
          </div>
          <div className="w-64 border-l border-[#1a3a1a]">
            <TerminalBurndown />
          </div>
        </div>
      </div>
    </div>
  );
}
