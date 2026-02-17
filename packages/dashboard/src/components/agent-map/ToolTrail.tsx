import { memo, useMemo } from 'react';
import { useSessionStore } from '../../stores/session-store';

interface ToolTrailProps {
  agentId: string;
  color: string;
}

/** 2-letter abbreviation for tool names */
const TOOL_ABBREV: Record<string, string> = {
  Edit: 'Ed',
  Read: 'Rd',
  Glob: 'Gl',
  Grep: 'Gr',
  Write: 'Wr',
  Bash: 'Bs',
  SendMessage: 'Sm',
  WebSearch: 'Ws',
  WebFetch: 'Wf',
  TaskCreate: 'Tc',
  TaskUpdate: 'Tu',
  TaskList: 'Tl',
  TaskGet: 'Tg',
  NotebookEdit: 'Nb',
};

/** Color category for tool badges */
function getToolBadgeColor(tool: string): string {
  switch (tool) {
    case 'Read':
    case 'Glob':
    case 'Grep':
      return 'rgba(59,130,246,0.25)'; // blue - reading
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return 'rgba(168,85,247,0.25)'; // purple - writing
    case 'Bash':
      return 'rgba(245,158,11,0.25)'; // amber - terminal
    case 'SendMessage':
      return 'rgba(236,72,153,0.25)'; // pink - communication
    case 'WebSearch':
    case 'WebFetch':
      return 'rgba(6,182,212,0.25)'; // cyan - research
    case 'TaskCreate':
    case 'TaskUpdate':
    case 'TaskList':
    case 'TaskGet':
      return 'rgba(16,185,129,0.25)'; // emerald - management
    default:
      return 'rgba(161,161,170,0.2)'; // zinc fallback
  }
}

/** Text color for tool badges */
function getToolTextColor(tool: string): string {
  switch (tool) {
    case 'Read':
    case 'Glob':
    case 'Grep':
      return '#93c5fd'; // blue
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return '#d8b4fe'; // purple
    case 'Bash':
      return '#fcd34d'; // amber
    case 'SendMessage':
      return '#f9a8d4'; // pink
    case 'WebSearch':
    case 'WebFetch':
      return '#67e8f9'; // cyan
    case 'TaskCreate':
    case 'TaskUpdate':
    case 'TaskList':
    case 'TaskGet':
      return '#6ee7b7'; // emerald
    default:
      return '#a1a1aa'; // zinc
  }
}

function ToolTrailInner({ agentId }: ToolTrailProps) {
  const events = useSessionStore((s) => s.events);

  const recentTools = useMemo(() => {
    const tools: string[] = [];
    for (const event of events) {
      if (tools.length >= 5) break;
      if (event.agentId === agentId && event.tool) {
        tools.push(event.tool);
      }
    }
    // Reverse so oldest is on left, newest on right
    return tools.reverse();
  }, [events, agentId]);

  if (recentTools.length === 0) return null;

  return (
    <div className="tool-trail">
      {recentTools.map((tool, i) => {
        const abbrev = TOOL_ABBREV[tool] ?? tool.slice(0, 2);
        return (
          <span
            key={`${tool}-${i}`}
            className="tool-trail-badge"
            style={{
              backgroundColor: getToolBadgeColor(tool),
              color: getToolTextColor(tool),
            }}
            title={tool}
          >
            {abbrev}
          </span>
        );
      })}
    </div>
  );
}

export const ToolTrail = memo(ToolTrailInner, (prev, next) => {
  return prev.agentId === next.agentId && prev.color === next.color;
});
