import { useEffect, useState } from "react";
import { useSessionStore } from "../../../stores/session-store";
import { formatElapsedTime, formatNumber } from "../../../lib/formatters";

const STAT_ICONS: Record<string, string> = {
  TIME: "\u231B",
  PARTY: "\u2694",
  SKILLS: "\u{1F3AF}",
  EVENTS: "\u{1F4DC}",
  LOOT: "\u{1F4E6}",
  POISON: "\u2620",
};

export function PixelStatsBar() {
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
    {
      label: "TIME",
      value: elapsed,
      icon: STAT_ICONS.TIME,
      color: "var(--pixel-text)",
    },
    {
      label: "PARTY",
      value: `${activeAgents}/${agents.length}`,
      icon: STAT_ICONS.PARTY,
      color: activeAgents > 0 ? "var(--pixel-green)" : "var(--pixel-text)",
    },
    {
      label: "SKILLS",
      value: formatNumber(totalToolCalls),
      icon: STAT_ICONS.SKILLS,
      color: "var(--pixel-cyan)",
    },
    {
      label: "EVENTS",
      value: formatNumber(session?.eventCount ?? 0),
      icon: STAT_ICONS.EVENTS,
      color: "var(--pixel-text)",
    },
    {
      label: "LOOT",
      value: formatNumber(fileEvents),
      icon: STAT_ICONS.LOOT,
      color: "var(--pixel-orange)",
    },
    {
      label: "POISON",
      value: String(totalErrors),
      icon: STAT_ICONS.POISON,
      color: totalErrors > 0 ? "var(--pixel-error)" : "var(--pixel-text)",
    },
  ];

  return (
    <div
      className="h-11 flex items-center gap-0 px-4 shrink-0"
      style={{
        background: "var(--pixel-bg-dark)",
        borderBottom: "3px solid var(--pixel-border)",
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex items-center gap-2"
          style={{
            borderLeft: i > 0 ? "2px solid var(--pixel-border)" : "none",
            paddingLeft: i > 0 ? "12px" : "0",
            marginLeft: i > 0 ? "12px" : "0",
          }}
        >
          <span className="pixel-text-sm">{stat.icon}</span>
          <span
            className="pixel-text-xs"
            style={{ color: "var(--pixel-text-dim)" }}
          >
            {stat.label}
          </span>
          <span
            className="pixel-text-sm"
            style={{ color: stat.color, fontWeight: "bold" }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
