import { useProjectStore, type ViewMode } from '../../../stores/project-store';
import { useSessionStore } from '../../../stores/session-store';
import { PixelStatsBar } from './PixelStatsBar';
import { PixelAgentPanel } from './PixelAgentPanel';
import { PixelActivityFeed } from './PixelActivityFeed';
import { PixelAgentDetail } from './PixelAgentDetail';
import { PixelTimeline } from './PixelTimeline';
import { PixelFileWatcher } from './PixelFileWatcher';
import { PixelKanban } from './PixelKanban';
import { PixelSprintProgress } from './PixelSprintProgress';
import { PixelBurndown } from './PixelBurndown';
import { PixelPRDOverview } from './PixelPRDOverview';
import { PixelDependencyGraph } from './PixelDependencyGraph';
import { PixelProjectSelector } from './PixelProjectSelector';
import { ThemeSwitcher } from '../../layout/ThemeSwitcher';
import './pixel.css';

export function PixelShell() {
  const { viewMode } = useProjectStore();
  const { isConnected } = useSessionStore();

  return (
    <div className="pixel-theme h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--pixel-bg)' }}>
      {/* HUD Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 pixel-hud shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="pixel-text-lg" style={{ color: 'var(--pixel-gold)' }}>
            CAM
          </h1>
          <span className="pixel-text-xs" style={{ color: 'var(--pixel-text-muted)' }}>
            CLAUDE AGENT MONITOR
          </span>
          <div className="flex items-center gap-2 ml-2">
            <div
              className={`w-3 h-3 ${isConnected ? 'pixel-pulse' : ''}`}
              style={{
                background: isConnected ? 'var(--pixel-green)' : 'var(--pixel-error)',
                boxShadow: isConnected ? '0 0 6px var(--pixel-green)' : '0 0 6px var(--pixel-error)',
              }}
            />
            <span
              className="pixel-text-xs"
              style={{ color: isConnected ? 'var(--pixel-green)' : 'var(--pixel-error)' }}
            >
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PixelProjectSelector />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Stats HUD */}
      <PixelStatsBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'monitor' && <MonitorLayout />}
        {viewMode === 'tracker' && <TrackerLayout />}
        {viewMode === 'mission-control' && <MissionControlLayout />}
      </div>

      {/* Bottom Timeline */}
      <PixelTimeline />
    </div>
  );
}

function MonitorLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <>
      {/* Left Sidebar - Party Panel */}
      <aside
        className="w-60 overflow-y-auto pixel-scrollbar shrink-0"
        style={{ borderRight: '3px solid var(--pixel-border)' }}
      >
        <PixelAgentPanel />
      </aside>

      {/* Center - Battle Log */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <PixelActivityFeed />
      </main>

      {/* Right Panel - Character Sheet or Inventory */}
      <aside
        className="w-72 overflow-y-auto pixel-scrollbar shrink-0"
        style={{ borderLeft: '3px solid var(--pixel-border)' }}
      >
        {selectedAgentId ? <PixelAgentDetail /> : <PixelFileWatcher />}
      </aside>
    </>
  );
}

function TrackerLayout() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Main Quest Board */}
        <main className="flex-1 overflow-hidden">
          <PixelKanban />
        </main>

        {/* Right sidebar - Chapter Progress + XP Chart */}
        <aside
          className="w-80 overflow-y-auto pixel-scrollbar shrink-0 flex flex-col"
          style={{ borderLeft: '3px solid var(--pixel-border)' }}
        >
          <PixelSprintProgress />
          <PixelBurndown />
          <PixelDependencyGraph />
        </aside>
      </div>

      {/* Bottom - Quest Journal */}
      <div
        className="h-48 overflow-y-auto pixel-scrollbar shrink-0"
        style={{ borderTop: '3px solid var(--pixel-border)' }}
      >
        <PixelPRDOverview />
      </div>
    </div>
  );
}

function MissionControlLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left - Party Monitor */}
      <div
        className="w-1/2 flex overflow-hidden"
        style={{ borderRight: '3px solid var(--pixel-border)' }}
      >
        <aside
          className="w-48 overflow-y-auto pixel-scrollbar shrink-0"
          style={{ borderRight: '3px solid var(--pixel-border)' }}
        >
          <PixelAgentPanel />
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <PixelActivityFeed />
          </div>
        </div>
      </div>

      {/* Right - Quest Board */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex">
          <main className="flex-1 overflow-hidden">
            <PixelKanban />
          </main>
        </div>
        <div
          className="h-32 flex shrink-0"
          style={{ borderTop: '3px solid var(--pixel-border)' }}
        >
          <div className="flex-1">
            <PixelSprintProgress />
          </div>
          <div className="w-64" style={{ borderLeft: '3px solid var(--pixel-border)' }}>
            <PixelBurndown />
          </div>
        </div>
      </div>
    </div>
  );
}
