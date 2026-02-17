import { useEffect, useState } from "react";
import { useSessionStore } from "../../../stores/session-store";
import { formatElapsedTime, formatNumber } from "../../../lib/formatters";

export function TerminalStatsBar() {
  const { session, agents, events } = useSessionStore();
  const [elapsed, setElapsed] = useState("00m 00s");

  useEffect(() => {
    if (!session?.startedAt) return;

    const update = () =>
      setElapsed(formatElapsedTime(session.startedAt, session.endedAt));
    update();

    if (!session.endedAt) {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.startedAt, session?.endedAt]);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalErrors = agents.reduce((sum, a) => sum + a.errorCount, 0);
  const totalToolCalls = agents.reduce((sum, a) => sum + a.toolCallCount, 0);
  const fileEvents = events.filter((e) => e.category === "file_change").length;

  const stats = [
    { label: "TIME", value: elapsed, isError: false },
    {
      label: "AGENTS",
      value: `${activeAgents}/${agents.length}`,
      isError: false,
    },
    { label: "CALLS", value: formatNumber(totalToolCalls), isError: false },
    {
      label: "EVENTS",
      value: formatNumber(session?.eventCount ?? 0),
      isError: false,
    },
    { label: "FILES", value: formatNumber(fileEvents), isError: false },
    { label: "ERRORS", value: String(totalErrors), isError: totalErrors > 0 },
  ];

  return (
    <div className="shrink-0 border-b border-[#1a3a1a] px-2 py-1 font-mono text-[11px]">
      <div className="flex items-center gap-0">
        <span className="terminal-dim mr-2">{"["}</span>
        {stats.map((stat, i) => (
          <span key={stat.label} className="flex items-center">
            {i > 0 && <span className="terminal-dim mx-1">|</span>}
            <span className="terminal-muted">{stat.label}:</span>
            <span
              className={`ml-1 font-bold ${stat.isError ? "terminal-error" : "text-[#00ff00] terminal-glow"}`}
            >
              {stat.value}
            </span>
          </span>
        ))}
        <span className="terminal-dim ml-2">{"]"}</span>
      </div>
    </div>
  );
}
