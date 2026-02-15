import { useThemeStore } from '../../stores/theme-store';
import { ModernShell } from '../themes/modern/ModernShell';
import { TerminalShell } from '../themes/terminal/TerminalShell';

export function Shell() {
  const { theme } = useThemeStore();

  switch (theme) {
    case 'terminal':
      return <TerminalShell />;
    case 'modern':
    case 'pixel':
    default:
      return <ModernShell />;
  }
}
