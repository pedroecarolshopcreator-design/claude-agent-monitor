import {
  useNotificationStore,
  type Toast,
  type NotificationType,
} from "../../stores/notification-store";
import { useThemeStore } from "../../stores/theme-store";

function ModernToast({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const colors: Record<NotificationType, string> = {
    info: "border-blue-500/50 bg-blue-500/10",
    success: "border-cam-success/50 bg-cam-success/10",
    warning: "border-amber-500/50 bg-amber-500/10",
    error: "border-cam-error/50 bg-cam-error/10",
  };

  const iconColors: Record<NotificationType, string> = {
    info: "text-blue-400",
    success: "text-cam-success",
    warning: "text-amber-400",
    error: "text-cam-error",
  };

  const icons: Record<NotificationType, string> = {
    info: "\u2139",
    success: "\u2713",
    warning: "\u26A0",
    error: "\u2717",
  };

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${colors[toast.type]} animate-slide-in-right`}
      style={{ minWidth: "240px", maxWidth: "360px" }}
    >
      <span className={`text-sm mt-0.5 ${iconColors[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-cam-text">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-cam-text-muted mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-cam-text-muted hover:text-cam-text text-xs ml-1 shrink-0"
      >
        x
      </button>
    </div>
  );
}

function PixelToast({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const colors: Record<NotificationType, string> = {
    info: "var(--pixel-blue, #4488ff)",
    success: "var(--pixel-green)",
    warning: "var(--pixel-gold)",
    error: "var(--pixel-error)",
  };

  const icons: Record<NotificationType, string> = {
    info: "\u25C6",
    success: "\u2605",
    warning: "!",
    error: "\u2620",
  };

  return (
    <div
      className="pixel-border animate-slide-in-right"
      style={{
        background: "var(--pixel-panel)",
        borderColor: colors[toast.type],
        borderWidth: "2px",
        borderStyle: "solid",
        padding: "6px 10px",
        minWidth: "240px",
        maxWidth: "360px",
      }}
    >
      <div className="flex items-start gap-2">
        <span className="pixel-text-xs" style={{ color: colors[toast.type] }}>
          {icons[toast.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="pixel-text-xs" style={{ color: colors[toast.type] }}>
            {toast.title}
          </p>
          {toast.message && (
            <p
              className="pixel-text-xs"
              style={{ color: "var(--pixel-text-muted)" }}
            >
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="pixel-text-xs"
          style={{ color: "var(--pixel-text-muted)" }}
        >
          x
        </button>
      </div>
    </div>
  );
}

function TerminalToast({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const prefixes: Record<NotificationType, { text: string; color: string }> = {
    info: { text: "[INFO]", color: "#00ff00" },
    success: { text: "[OK]", color: "#00ff00" },
    warning: { text: "[WARN]", color: "#ffaa00" },
    error: { text: "[ERR]", color: "#ff0000" },
  };

  const prefix = prefixes[toast.type];

  return (
    <div
      className="font-mono text-[11px] border border-[#1a3a1a] bg-[#0a0a0a] px-2 py-1 animate-slide-in-right"
      style={{ minWidth: "240px", maxWidth: "360px" }}
    >
      <div className="flex items-start gap-1">
        <span style={{ color: prefix.color }}>{prefix.text}</span>
        <span className="text-[#00ff00] flex-1">{toast.title}</span>
        <button
          onClick={onDismiss}
          className="text-[#555] hover:text-[#00ff00]"
        >
          [x]
        </button>
      </div>
      {toast.message && (
        <div className="text-[#00aa00] ml-7">{toast.message}</div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();
  const { theme } = useThemeStore();

  if (toasts.length === 0) return null;

  const ToastComponent =
    {
      modern: ModernToast,
      pixel: PixelToast,
      terminal: TerminalToast,
    }[theme] ?? ModernToast;

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
