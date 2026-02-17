import { memo, useState, useEffect } from 'react';

interface AgentTimerProps {
  lastActivityAt: string;
  status: string;
}

/** Format elapsed seconds into a readable string */
function formatElapsed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 5) {
    const remainSec = seconds % 60;
    return `${minutes}m ${remainSec}s`;
  }
  return `${minutes}m+`;
}

/** Get color class based on how stale the activity is */
function getTimerColor(seconds: number): string {
  if (seconds < 10) return '#4ade80';     // green - very recent
  if (seconds < 30) return '#facc15';     // yellow - getting stale
  if (seconds < 120) return '#fb923c';    // orange - idle
  return '#f87171';                        // red - long idle
}

function AgentTimerInner({ lastActivityAt, status }: AgentTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Don't tick for completed/shutdown agents
    if (status === 'completed' || status === 'shutdown') {
      const ts = new Date(lastActivityAt).getTime();
      if (!Number.isNaN(ts)) {
        setElapsed(Math.max(0, Math.floor((Date.now() - ts) / 1000)));
      }
      return;
    }

    function update() {
      const ts = new Date(lastActivityAt).getTime();
      if (Number.isNaN(ts)) {
        setElapsed(0);
        return;
      }
      setElapsed(Math.max(0, Math.floor((Date.now() - ts) / 1000)));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastActivityAt, status]);

  const color = getTimerColor(elapsed);
  const label = formatElapsed(elapsed);

  return (
    <span
      className="agent-timer"
      style={{ color }}
      title={`Last activity: ${lastActivityAt}`}
    >
      {label}
    </span>
  );
}

export const AgentTimer = memo(AgentTimerInner, (prev, next) => {
  return (
    prev.lastActivityAt === next.lastActivityAt &&
    prev.status === next.status
  );
});
