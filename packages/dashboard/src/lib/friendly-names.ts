/**
 * Friendly Agent Naming System
 *
 * Generates human-readable names for agents and sessions:
 * - Main agent: "Main" (or project name)
 * - Subagents: use name from Task/TeamCreate (e.g., "researcher")
 * - Fallback: Docker-style friendly names from hash (e.g., "brave-panda")
 * - Session IDs: "Sessao #N" or timestamp format
 */

/** Adjectives for Docker-style names */
const ADJECTIVES = [
  "brave",
  "calm",
  "eager",
  "fair",
  "happy",
  "keen",
  "noble",
  "quick",
  "swift",
  "wise",
  "bold",
  "cool",
  "fresh",
  "kind",
  "sharp",
  "vivid",
  "warm",
  "bright",
  "clever",
  "gentle",
  "loyal",
  "proud",
  "steady",
  "witty",
  "agile",
] as const;

/** Animals for Docker-style names */
const ANIMALS = [
  "panda",
  "fox",
  "owl",
  "wolf",
  "hawk",
  "lynx",
  "bear",
  "deer",
  "seal",
  "crane",
  "falcon",
  "tiger",
  "raven",
  "otter",
  "eagle",
  "heron",
  "bison",
  "cobra",
  "dingo",
  "gecko",
  "koala",
  "lemur",
  "moose",
  "quail",
  "viper",
] as const;

/** Known names that indicate a "main" / lead agent */
const MAIN_AGENT_PATTERNS = new Set([
  "main",
  "team-lead",
  "team_lead",
  "teamlead",
  "lead",
  "orchestrator",
  "coordinator",
]);

/**
 * Simple string hash function (djb2).
 * Returns a positive integer.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generate a Docker-style friendly name from a string seed.
 * E.g., "brave-panda", "swift-owl"
 */
export function generateFriendlyName(seed: string): string {
  const hash = hashString(seed);
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const animal = ANIMALS[(hash >> 8) % ANIMALS.length];
  return `${adjective}-${animal}`;
}

/**
 * Get the display name for an agent.
 *
 * Priority:
 * 1. If name matches main/lead patterns -> "Main"
 * 2. If agent has a meaningful name (not just an ID) -> use it as-is
 * 3. If name looks like a UUID/hash -> generate friendly name
 */
export function getAgentDisplayName(
  agentId: string,
  agentName: string,
): string {
  const lowerName = agentName.toLowerCase().trim();

  // Main agent detection
  if (MAIN_AGENT_PATTERNS.has(lowerName)) {
    return "Main";
  }

  // If the name is meaningful (not a UUID-like string), use it
  if (isMeaningfulName(agentName)) {
    return agentName;
  }

  // Fallback: generate Docker-style name from the agent ID
  return generateFriendlyName(agentId);
}

/**
 * Check if a name is "meaningful" (human-assigned) vs auto-generated (UUID/hash).
 * UUIDs and hashes typically have lots of digits and dashes.
 */
function isMeaningfulName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;

  // If name is short and alphanumeric with dashes/underscores, it's likely a real name
  // UUIDs: 8-4-4-4-12 hex chars (36 chars total)
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(trimmed)) return false;

  // Long hex strings are likely auto-generated IDs
  const hexPattern = /^[0-9a-f]{12,}$/i;
  if (hexPattern.test(trimmed)) return false;

  // Very short single-char names are not meaningful
  if (trimmed.length <= 1) return false;

  return true;
}

/**
 * Get a short version of a session ID for display as subtitle.
 * Returns first 8 characters.
 */
export function getShortSessionId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

/**
 * Format a session for display.
 * Returns a friendly label like "Sessao #1" or a timestamp-based label.
 */
export function formatSessionLabel(
  sessionId: string,
  index: number,
  startedAt?: string,
): { label: string; subtitle: string; tooltip: string } {
  const subtitle = getShortSessionId(sessionId);

  if (startedAt) {
    const date = new Date(startedAt);
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });

    return {
      label: `${time} - ${day}`,
      subtitle,
      tooltip: sessionId,
    };
  }

  return {
    label: `Sessao #${index + 1}`,
    subtitle,
    tooltip: sessionId,
  };
}

/**
 * Extract the filename from a file path.
 * E.g., "/src/components/App.tsx" -> "App.tsx"
 */
export function extractFilename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

/**
 * Format a file path for display: filename as primary, full path as tooltip.
 */
export function formatFilePath(filePath: string): {
  display: string;
  tooltip: string;
} {
  return {
    display: extractFilename(filePath),
    tooltip: filePath,
  };
}
