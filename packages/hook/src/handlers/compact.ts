import { sendEvent } from '../transport.js';

export function handlePreCompact(): void {
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';

  const currentTokensStr = process.env.CLAUDE_COMPACT_CURRENT_TOKENS;
  const thresholdStr = process.env.CLAUDE_COMPACT_THRESHOLD;

  const currentTokens = currentTokensStr ? parseInt(currentTokensStr, 10) : undefined;
  const threshold = thresholdStr ? parseInt(thresholdStr, 10) : undefined;

  sendEvent({
    hook: 'PreCompact',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      current_tokens: currentTokens,
      threshold,
    },
  });
}

export function handlePostCompact(): void {
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';

  const tokensBeforeStr = process.env.CLAUDE_COMPACT_TOKENS_BEFORE;
  const tokensAfterStr = process.env.CLAUDE_COMPACT_TOKENS_AFTER;
  const messagesRemovedStr = process.env.CLAUDE_COMPACT_MESSAGES_REMOVED;

  const tokensBefore = tokensBeforeStr ? parseInt(tokensBeforeStr, 10) : undefined;
  const tokensAfter = tokensAfterStr ? parseInt(tokensAfterStr, 10) : undefined;
  const messagesRemoved = messagesRemovedStr ? parseInt(messagesRemovedStr, 10) : undefined;

  sendEvent({
    hook: 'PostCompact',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      tokens_before: tokensBefore,
      tokens_after: tokensAfter,
      messages_removed: messagesRemoved,
    },
  });
}
