import { MAX_OUTPUT_LENGTH } from '@cam/shared';
import { sendEvent } from '../transport.js';

export function handleNotification(): void {
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';

  let message: string | undefined;
  const rawNotification = process.env.CLAUDE_NOTIFICATION;
  if (rawNotification) {
    message = rawNotification.length > MAX_OUTPUT_LENGTH
      ? rawNotification.slice(0, MAX_OUTPUT_LENGTH)
      : rawNotification;
  }

  const level = process.env.CLAUDE_NOTIFICATION_LEVEL ?? 'info';

  sendEvent({
    hook: 'Notification',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      message,
      level,
    },
  });
}
