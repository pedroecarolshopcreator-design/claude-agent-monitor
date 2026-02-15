import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'modern' | 'pixel' | 'terminal';

interface ThemeState {
  theme: ThemeName;
  accentColor: string;
  setTheme: (theme: ThemeName) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'modern',
      accentColor: '#3b82f6',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: 'cam-theme',
    }
  )
);
