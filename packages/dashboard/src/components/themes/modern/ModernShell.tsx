import { useProjectStore, type ViewMode } from "../../../stores/project-store";
import { useSessionStore } from "../../../stores/session-store";
import { ModernStatsBar } from "./ModernStatsBar";
import { ModernAgentPanel } from "./ModernAgentPanel";
import { ModernActivityFeed } from "./ModernActivityFeed";
import { ModernAgentDetail } from "./ModernAgentDetail";
import { ModernTimeline } from "./ModernTimeline";
import { ModernFileWatcher } from "./ModernFileWatcher";
import { ModernKanban } from "./ModernKanban";
import { ModernSprintProgress } from "./ModernSprintProgress";
import { ModernBurndown } from "./ModernBurndown";
import { ModernPRDOverview } from "./ModernPRDOverview";
import { ModernDependencyGraph } from "./ModernDependencyGraph";
import { ModernProjectSelector } from "./ModernProjectSelector";
import { ThemeSwitcher } from "../../layout/ThemeSwitcher";
import { ActivityWindowSelector } from "../../shared/ActivityWindowSelector";
import { SessionPicker } from "../../shared/SessionPicker";
import { AgentMap } from "../../agent-map/AgentMap";
import { TaskDetailPanel } from "../../shared/TaskDetailPanel";
import "./modern.css";

function ConnectionIndicator() {
  const { connectionStatus } = useSessionStore();

  const config = {
    connected: {
      dotClass: "bg-cam-success animate-pulse-dot",
      textClass: "text-cam-success",
      label: "Conectado",
      sublabel: "capturando eventos",
    },
    reconnecting: {
      dotClass: "bg-amber-400 animate-pulse",
      textClass: "text-amber-400",
      label: "Reconectando...",
      sublabel: "",
    },
    disconnected: {
      dotClass: "bg-cam-error",
      textClass: "text-cam-error",
      label: "Desconectado",
      sublabel: "aguardando server",
    },
  }[connectionStatus];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span className={`text-xs ${config.textClass}`}>{config.label}</span>
      {config.sublabel && (
        <span className="text-xs text-cam-text-muted">- {config.sublabel}</span>
      )}
    </div>
  );
}

export function ModernShell() {
  const { viewMode } = useProjectStore();

  return (
    <div className="h-screen w-screen flex flex-col modern-gradient-bg overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-cam-border/50 modern-glass shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-cam-text tracking-tight">
            Claude Agent Monitor
          </h1>
          <ConnectionIndicator />
        </div>

        <div className="flex items-center gap-3">
          <ActivityWindowSelector />
          <SessionPicker />
          <ModernProjectSelector />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Stats Bar */}
      <ModernStatsBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "map" && <MapLayout />}
        {viewMode === "monitor" && <MonitorLayout />}
        {viewMode === "tracker" && <TrackerLayout />}
        {viewMode === "mission-control" && <MissionControlLayout />}
      </div>

      {/* Bottom Timeline */}
      <ModernTimeline />
    </div>
  );
}

function MapLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <>
      {/* Left Sidebar - Agent Panel */}
      <aside className="w-48 border-r border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
        <ModernAgentPanel />
      </aside>

      {/* Center - Agent Map */}
      <main className="flex-1 overflow-hidden">
        <AgentMap />
      </main>

      {/* Right Panel - Activity Feed or Agent Detail */}
      <aside className="w-72 border-l border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
        {selectedAgentId ? <ModernAgentDetail /> : <ModernActivityFeed />}
      </aside>
    </>
  );
}

function MonitorLayout() {
  const { selectedAgentId } = useSessionStore();

  return (
    <>
      {/* Left Sidebar - Agent Panel */}
      <aside className="w-56 border-r border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
        <ModernAgentPanel />
      </aside>

      {/* Center - Activity Feed */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <ModernActivityFeed />
      </main>

      {/* Right Panel - Agent Detail or File Watcher */}
      <aside className="w-72 border-l border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
        {selectedAgentId ? <ModernAgentDetail /> : <ModernFileWatcher />}
      </aside>
    </>
  );
}

function TrackerLayout() {
  const { selectedTaskId } = useProjectStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Main Kanban */}
        <main className="flex-1 overflow-hidden">
          <ModernKanban />
        </main>

        {/* Task Detail Panel (when a task is selected) */}
        {selectedTaskId && (
          <aside className="w-80 border-l border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
            <TaskDetailPanel />
          </aside>
        )}

        {/* Right sidebar - Sprint Progress + Burndown */}
        <aside className="w-80 border-l border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0 flex flex-col">
          <ModernSprintProgress />
          <ModernBurndown />
          <ModernDependencyGraph />
        </aside>
      </div>

      {/* Bottom - PRD Overview */}
      <div className="h-48 border-t border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
        <ModernPRDOverview />
      </div>
    </div>
  );
}

function MissionControlLayout() {
  const { selectedAgentId } = useSessionStore();
  const { selectedTaskId } = useProjectStore();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left - Agent Monitor */}
      <div className="w-1/2 flex border-r border-cam-border/50 overflow-hidden">
        <aside className="w-48 border-r border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
          <ModernAgentPanel />
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ModernActivityFeed />
          </div>
        </div>
      </div>

      {/* Right - PRD Tracker */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex">
          <main className="flex-1 overflow-hidden">
            <ModernKanban />
          </main>
          {selectedTaskId && (
            <aside className="w-72 border-l border-cam-border/50 overflow-y-auto modern-scrollbar shrink-0">
              <TaskDetailPanel />
            </aside>
          )}
        </div>
        <div className="h-32 border-t border-cam-border/50 flex shrink-0">
          <div className="flex-1">
            <ModernSprintProgress />
          </div>
          <div className="w-64 border-l border-cam-border/50">
            <ModernBurndown />
          </div>
        </div>
      </div>
    </div>
  );
}
