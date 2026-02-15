import { sendEvent } from '../transport.js';

export function handleSubagentStop(): void {
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';
  const agentName = process.env.CLAUDE_AGENT_NAME ?? agentId;
  const reason = process.env.CLAUDE_STOP_REASON ?? 'unknown';

  sendEvent({
    hook: 'SubagentStop',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      agent_name: agentName,
      reason,
    },
  });
}
