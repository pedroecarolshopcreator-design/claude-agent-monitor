import { useThemeStore, type ThemeName } from '../../stores/theme-store';

const themes: { id: ThemeName; label: string; icon: string }[] = [
  { id: 'modern', label: 'Modern', icon: 'M' },
  { id: 'pixel', label: 'Pixel', icon: 'P' },
  { id: 'terminal', label: 'Terminal', icon: 'T' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-cam-surface-2 p-1 border border-cam-border">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
            ${
              theme === t.id
                ? 'bg-cam-accent text-white shadow-sm'
                : 'text-cam-text-muted hover:text-cam-text-secondary hover:bg-cam-surface-3'
            }
          `}
          title={t.label}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
