import { sendEvent } from '../transport.js';

export function handleStop(): void {
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';
  const reason = process.env.CLAUDE_STOP_REASON ?? 'unknown';
  const stopType = process.env.CLAUDE_STOP_TYPE ?? 'natural';

  sendEvent({
    hook: 'Stop',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      reason,
      stop_type: stopType,
    },
  });
}
