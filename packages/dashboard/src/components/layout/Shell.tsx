import { useThemeStore } from "../../stores/theme-store";
import { useSessionStore } from "../../stores/session-store";
import { ModernShell } from "../themes/modern/ModernShell";
import { TerminalShell } from "../themes/terminal/TerminalShell";
import { PixelShell } from "../themes/pixel/PixelShell";
import { EmptyState } from "../shared/EmptyState";

export function Shell() {
  const { theme } = useThemeStore();
  const session = useSessionStore((s) => s.session);
  const events = useSessionStore((s) => s.events);

  // Show empty/onboarding state when no session and no events
  if (!session && events.length === 0) {
    return <EmptyState />;
  }

  switch (theme) {
    case "terminal":
      return <TerminalShell />;
    case "pixel":
      return <PixelShell />;
    case "modern":
    default:
      return <ModernShell />;
  }
}
