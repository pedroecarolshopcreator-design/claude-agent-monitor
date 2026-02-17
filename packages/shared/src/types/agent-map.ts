// === Legacy zone types (kept for backwards compat, used by zone-logic.ts) ===

export type AgentZone =
  | 'library'
  | 'workshop'
  | 'terminal'
  | 'comms'
  | 'research'
  | 'taskboard'
  | 'rest'
  | 'done';

export type AgentAnimationState =
  | 'idle'
  | 'working'
  | 'moving'
  | 'talking'
  | 'error'
  | 'completed'
  | 'shutdown';

// === Mission Floor v2: Pose-based system ===

/** 8 distinct visual poses for agent sprites */
export type AgentPose =
  | 'idle'         // Default standing - relaxed, breathing animation
  | 'coding'       // Typing at keyboard (Edit, Write)
  | 'reading'      // Holding/examining document (Read, Glob, Grep)
  | 'terminal'     // At terminal console (Bash)
  | 'talking'      // Gesturing, communicating (SendMessage)
  | 'searching'    // Looking through magnifier (WebSearch, WebFetch)
  | 'managing'     // Holding clipboard (TaskCreate, TaskUpdate)
  | 'celebrating'; // Arms up, victory! (completed)

/** Maps tool names to the pose the agent should display */
export const TOOL_TO_POSE_MAP: Record<string, AgentPose> = {
  Read: 'reading',
  Glob: 'reading',
  Grep: 'reading',
  Edit: 'coding',
  Write: 'coding',
  NotebookEdit: 'coding',
  Bash: 'terminal',
  SendMessage: 'talking',
  WebSearch: 'searching',
  WebFetch: 'searching',
  TaskCreate: 'managing',
  TaskUpdate: 'managing',
  TaskList: 'managing',
  TaskGet: 'reading',
};

/** Agent color palette - assigned per agent for visual distinction */
export interface AgentPalette {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

/** Pre-defined palettes for agents (assigned by name hash) */
export const AGENT_PALETTES: AgentPalette[] = [
  { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#c4b5fd', glow: 'rgba(139,92,246,0.4)' },  // purple
  { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#93c5fd', glow: 'rgba(59,130,246,0.4)' },   // blue
  { primary: '#ef4444', secondary: '#b91c1c', accent: '#fca5a5', glow: 'rgba(239,68,68,0.4)' },    // red
  { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7', glow: 'rgba(16,185,129,0.4)' },   // green
  { primary: '#f59e0b', secondary: '#d97706', accent: '#fcd34d', glow: 'rgba(245,158,11,0.4)' },   // amber
  { primary: '#ec4899', secondary: '#be185d', accent: '#f9a8d4', glow: 'rgba(236,72,153,0.4)' },   // pink
  { primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9', glow: 'rgba(6,182,212,0.4)' },    // cyan
  { primary: '#f97316', secondary: '#c2410c', accent: '#fdba74', glow: 'rgba(249,115,22,0.4)' },   // orange
  { primary: '#a855f7', secondary: '#7e22ce', accent: '#d8b4fe', glow: 'rgba(168,85,247,0.4)' },   // violet
  { primary: '#14b8a6', secondary: '#0d9488', accent: '#5eead4', glow: 'rgba(20,184,166,0.4)' },   // teal
];

/** Get palette for an agent based on name hash */
export function getAgentPalette(agentName: string): AgentPalette {
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = ((hash << 5) - hash + agentName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AGENT_PALETTES.length;
  return AGENT_PALETTES[index];
}

/** Agent's position and state in the Mission Floor */
export interface AgentMapPosition {
  agentId: string;
  zone: AgentZone;
  previousZone: AgentZone | null;
  animationState: AgentAnimationState;
  lastTool: string | null;
  activityLabel: string | null;
  pose: AgentPose;
  parentAgentId: string | null;
}

export interface SpeechBubbleData {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  message: string;
  timestamp: number;
}

export interface InteractionLineData {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: 'message' | 'spawn' | 'task_assign';
  timestamp: number;
}

// === Legacy zone metadata (still used by zone-logic.ts) ===

export const ZONE_META: Record<AgentZone, { label: string; icon: string; description: string }> = {
  library:   { label: 'Library',    icon: '{}',   description: 'Reading & searching code' },
  workshop:  { label: 'Workshop',   icon: '/+',   description: 'Editing & writing code' },
  terminal:  { label: 'Terminal',   icon: '>_',   description: 'Running commands' },
  research:  { label: 'Research',   icon: '?!',   description: 'Web search & fetch' },
  comms:     { label: 'Comms Hub',  icon: '<<>>', description: 'Agent communication' },
  taskboard: { label: 'Task Board', icon: '[]',   description: 'Managing tasks' },
  rest:      { label: 'Rest Area',  icon: 'zZ',   description: 'Agent idle' },
  done:      { label: 'Done Zone',  icon: '**',   description: 'Completed work' },
};

export const TOOL_TO_ZONE_MAP: Record<string, AgentZone> = {
  Read: 'library',
  Glob: 'library',
  Grep: 'library',
  Edit: 'workshop',
  Write: 'workshop',
  NotebookEdit: 'workshop',
  Bash: 'terminal',
  SendMessage: 'comms',
  WebSearch: 'research',
  WebFetch: 'research',
  TaskCreate: 'taskboard',
  TaskUpdate: 'taskboard',
  TaskList: 'taskboard',
  TaskGet: 'taskboard',
};
