import { useMemo } from 'react';
import { useSessionStore } from '../../../stores/session-store';
import { getStatusDotColor, generateIdenticon } from '../../../lib/formatters';

export function ModernTimeline() {
  const { session, agents, events } = useSessionStore();

  const timelineData = useMemo(() => {
    if (!session?.startedAt || agents.length === 0) return null;

    const start = new Date(session.startedAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    const totalDuration = Math.max(end - start, 1);

    return agents.map((agent) => {
      const agentEvents = events.filter((e) => e.agentId === agent.id);
      const segments = agentEvents.reduce<{ start: number; end: number; status: string }[]>((acc, event) => {
        const eventTime = new Date(event.timestamp).getTime();
        const position = ((eventTime - start) / totalDuration) * 100;
        const hasError = event.category === 'error' || !!event.error;

        acc.push({
          start: position,
          end: Math.min(position + 0.5, 100),
          status: hasError ? 'error' : 'active',
        });
        return acc;
      }, []);

      return {
        agent,
        segments,
      };
    });
  }, [session, agents, events]);

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="h-16 border-t border-cam-border/50 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-cam-text-muted">Timeline will appear when agents are active</span>
      </div>
    );
  }

  return (
    <div className="h-24 border-t border-cam-border/50 bg-cam-surface/20 shrink-0 px-4 py-2 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          Session Timeline
        </span>
      </div>

      <div className="space-y-1.5">
        {timelineData.map(({ agent, segments }) => {
          const identiconColor = generateIdenticon(agent.name);
          return (
            <div key={agent.id} className="flex items-center gap-2">
              <span
                className="text-[9px] w-16 truncate font-medium shrink-0"
                style={{ color: identiconColor }}
              >
                {agent.name}
              </span>
              <div className="flex-1 h-3 bg-cam-surface-2 rounded-full relative overflow-hidden">
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 h-full rounded-full ${
                      seg.status === 'error' ? 'bg-cam-error/70' : 'bg-cam-accent/60'
                    }`}
                    style={{
                      left: `${seg.start}%`,
                      width: `${Math.max(seg.end - seg.start, 0.3)}%`,
                    }}
                  />
                ))}
                {/* Current position indicator */}
                <div
                  className={`absolute top-0 w-0.5 h-full ${getStatusDotColor(agent.status)}`}
                  style={{ left: '100%' }}
                />
              </div>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotColor(agent.status)}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
