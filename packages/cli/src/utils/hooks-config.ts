export interface HookEntry {
  matcher: string;
  command: string;
}

export interface HooksConfig {
  PreToolUse: HookEntry[];
  PostToolUse: HookEntry[];
  Notification: HookEntry[];
  Stop: HookEntry[];
  SubagentStop: HookEntry[];
  PreCompact: HookEntry[];
  PostCompact: HookEntry[];
}

const CAM_HOOK_MARKER = 'cam-hook';

export function generateHooksConfig(): HooksConfig {
  return {
    PreToolUse: [
      {
        matcher: '*',
        command: 'cam-hook pre-tool-use',
      },
    ],
    PostToolUse: [
      {
        matcher: '*',
        command: 'cam-hook post-tool-use',
      },
    ],
    Notification: [
      {
        matcher: '*',
        command: 'cam-hook notification',
      },
    ],
    Stop: [
      {
        matcher: '*',
        command: 'cam-hook stop',
      },
    ],
    SubagentStop: [
      {
        matcher: '*',
        command: 'cam-hook subagent-stop',
      },
    ],
    PreCompact: [
      {
        matcher: '*',
        command: 'cam-hook pre-compact',
      },
    ],
    PostCompact: [
      {
        matcher: '*',
        command: 'cam-hook post-compact',
      },
    ],
  };
}

export function mergeHooks(
  existing: Record<string, unknown>,
  camHooks: HooksConfig,
): Record<string, unknown> {
  const existingHooks = (existing.hooks ?? {}) as Record<string, HookEntry[]>;
  const merged: Record<string, HookEntry[]> = {};

  for (const [hookType, entries] of Object.entries(camHooks)) {
    const existingEntries = existingHooks[hookType] ?? [];

    // Filter out any existing CAM hooks to avoid duplicates
    const nonCamEntries = existingEntries.filter(
      (entry) => !isCamHook(entry),
    );

    // Append CAM hooks at the end
    merged[hookType] = [...nonCamEntries, ...entries];
  }

  // Preserve hook types not managed by CAM
  for (const [hookType, entries] of Object.entries(existingHooks)) {
    if (!(hookType in camHooks)) {
      merged[hookType] = entries;
    }
  }

  return {
    ...existing,
    hooks: merged,
  };
}

export function removeCamHooks(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const hooks = (settings.hooks ?? {}) as Record<string, HookEntry[]>;
  const cleaned: Record<string, HookEntry[]> = {};

  for (const [hookType, entries] of Object.entries(hooks)) {
    const nonCamEntries = entries.filter((entry) => !isCamHook(entry));
    if (nonCamEntries.length > 0) {
      cleaned[hookType] = nonCamEntries;
    }
  }

  const result = { ...settings };
  if (Object.keys(cleaned).length > 0) {
    result.hooks = cleaned;
  } else {
    delete result.hooks;
  }

  return result;
}

export function isCamHook(entry: HookEntry): boolean {
  return entry.command.includes(CAM_HOOK_MARKER);
}

export function listConfiguredCamHooks(
  settings: Record<string, unknown>,
): Array<{ hookType: string; command: string }> {
  const hooks = (settings.hooks ?? {}) as Record<string, HookEntry[]>;
  const result: Array<{ hookType: string; command: string }> = [];

  for (const [hookType, entries] of Object.entries(hooks)) {
    for (const entry of entries) {
      if (isCamHook(entry)) {
        result.push({ hookType, command: entry.command });
      }
    }
  }

  return result;
}

export const HOOK_TYPE_DESCRIPTIONS: Record<string, string> = {
  PreToolUse: 'Before each tool call (all tools)',
  PostToolUse: 'After each tool call (all tools)',
  Notification: 'When Claude Code sends a notification',
  Stop: 'When the main agent stops',
  SubagentStop: 'When a sub-agent (teammate) stops',
  PreCompact: 'Before context compaction',
  PostCompact: 'After context compaction',
};
