import { useSessionStore } from "../../stores/session-store";
import { useThemeStore } from "../../stores/theme-store";

const WINDOW_OPTIONS = [
  { label: "1m", value: 60_000 },
  { label: "3m", value: 180_000 },
  { label: "5m", value: 300_000 },
  { label: "10m", value: 600_000 },
] as const;

export function ActivityWindowSelector() {
  const theme = useThemeStore((s) => s.theme);

  if (theme === "pixel") return <PixelVariant />;
  if (theme === "terminal") return <TerminalVariant />;
  return <ModernVariant />;
}

function ModernVariant() {
  const { activityWindow, setActivityWindow } = useSessionStore();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-cam-text-muted">
        Janela
      </span>
      <div className="flex items-center gap-0.5">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActivityWindow(opt.value)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
              activityWindow === opt.value
                ? "bg-cam-accent text-white"
                : "text-cam-text-muted hover:text-cam-text hover:bg-cam-surface/60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PixelVariant() {
  const { activityWindow, setActivityWindow } = useSessionStore();

  return (
    <div className="flex items-center gap-2">
      <span
        className="pixel-text-xs"
        style={{ color: "var(--pixel-text-dim)" }}
      >
        JANELA
      </span>
      <div className="flex items-center gap-1">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActivityWindow(opt.value)}
            className="pixel-text-xs transition-colors"
            style={{
              color:
                activityWindow === opt.value
                  ? "var(--pixel-gold)"
                  : "var(--pixel-text-muted)",
              background:
                activityWindow === opt.value
                  ? "var(--pixel-bg-dark)"
                  : "transparent",
              border:
                activityWindow === opt.value
                  ? "2px solid var(--pixel-gold)"
                  : "2px solid transparent",
              padding: "1px 4px",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TerminalVariant() {
  const { activityWindow, setActivityWindow } = useSessionStore();

  return (
    <div className="flex items-center gap-1 font-mono text-[11px]">
      <span className="terminal-muted">JANELA:</span>
      {WINDOW_OPTIONS.map((opt, i) => (
        <span key={opt.value} className="flex items-center">
          {i > 0 && <span className="terminal-dim">/</span>}
          <button
            onClick={() => setActivityWindow(opt.value)}
            className={`transition-colors ${
              activityWindow === opt.value
                ? "text-[#00ff00] terminal-glow font-bold"
                : "terminal-muted hover:text-[#00aa00]"
            }`}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
