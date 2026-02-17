import { useState } from 'react';
import { useSessionStore } from '../../stores/session-store.js';

interface AgentRightPanelProps {
  AgentDetail: React.ComponentType;
  ActivityFeed: React.ComponentType;
  FileWatcher: React.ComponentType;
  /** CSS class name for the tab bar styling (theme-specific) */
  tabBarClass?: string;
  /** CSS class name for active tab */
  activeTabClass?: string;
  /** CSS class name for inactive tab */
  inactiveTabClass?: string;
  /** CSS class name for the panel container */
  panelClass?: string;
}

type RightTab = 'activity' | 'files';

export function AgentRightPanel({
  AgentDetail,
  ActivityFeed,
  FileWatcher,
  tabBarClass = 'flex border-b border-cam-border/50 bg-cam-surface/50',
  activeTabClass = 'text-cam-accent border-b-2 border-cam-accent',
  inactiveTabClass = 'text-cam-text-muted hover:text-cam-text',
  panelClass = 'flex-1 overflow-y-auto',
}: AgentRightPanelProps) {
  const selectedAgentId = useSessionStore((s) => s.selectedAgentId);
  const [activeTab, setActiveTab] = useState<RightTab>('activity');

  // When an agent is selected, show agent detail (no tabs)
  if (selectedAgentId) {
    return <AgentDetail />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className={tabBarClass}>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
            activeTab === 'activity' ? activeTabClass : inactiveTabClass
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
            activeTab === 'files' ? activeTabClass : inactiveTabClass
          }`}
        >
          Files
        </button>
      </div>

      {/* Tab content */}
      <div className={panelClass}>
        {activeTab === 'activity' ? <ActivityFeed /> : <FileWatcher />}
      </div>
    </div>
  );
}
