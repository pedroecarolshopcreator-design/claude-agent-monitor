import { useThemeStore } from '../../stores/theme-store';
import { ModernShell } from '../themes/modern/ModernShell';

export function Shell() {
  const { theme } = useThemeStore();

  // For now, only Modern theme is implemented
  // Pixel and Terminal themes will render ModernShell as fallback
  switch (theme) {
    case 'modern':
    case 'pixel':
    case 'terminal':
    default:
      return <ModernShell />;
  }
}
