import type { ComponentType } from 'react';
import type { ThemeName } from '../stores/theme-store';

export interface ThemeComponents {
  Shell: ComponentType;
  AgentPanel: ComponentType;
  ActivityFeed: ComponentType;
  FileWatcher: ComponentType;
  StatsBar: ComponentType;
  AgentDetail: ComponentType;
  Timeline: ComponentType;
  Kanban: ComponentType;
  SprintProgress: ComponentType;
  PRDOverview: ComponentType;
  DependencyGraph: ComponentType;
  Burndown: ComponentType;
  ProjectSelector: ComponentType;
}

const registry = new Map<ThemeName, ThemeComponents>();

export function registerTheme(name: ThemeName, components: ThemeComponents): void {
  registry.set(name, components);
}

export function getThemeComponents(name: ThemeName): ThemeComponents | undefined {
  return registry.get(name);
}

export function getRegisteredThemes(): ThemeName[] {
  return Array.from(registry.keys());
}
