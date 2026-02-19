import { useAgentMapStore } from '../../stores/agent-map-store';
import { useSessionStore } from '../../stores/session-store';

export function AgentMapHeader() {
  const positions = useAgentMapStore((s) => s.positions);
  const session = useSessionStore((s) => s.session);
  const connectionStatus = useSessionStore((s) => s.connectionStatus);
  const agentCount = positions.size;

  // For completed sessions with 0 current positions, show historical count
  const displayCount = agentCount > 0 ? agentCount : (session?.agentCount ?? 0);
  const isLive = session?.status === 'active' && connectionStatus === 'connected';
  const isCompleted = session?.status === 'completed';

  return (
    <div className="agent-map-header">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-cam-text tracking-tight">Agent Map</span>
        {session && (
          <>
            <span className="text-[10px] text-cam-text-muted font-mono">
              {displayCount} agent{displayCount !== 1 ? 's' : ''}
            </span>
            {/* Live indicator - small green dot when connected and active */}
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {/* Completed badge */}
            {isCompleted && (
              <span className="text-[9px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-zinc-800/50">
                ended
              </span>
            )}
          </>
        )}
        {!session && (
          <span className="text-[10px] text-cam-text-muted font-mono">
            {agentCount} agent{agentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
