import { MAX_INPUT_LENGTH } from '@cam/shared';
import { sendEvent } from '../transport.js';

export function handlePreToolUse(): void {
  const toolName = process.env.CLAUDE_TOOL_NAME ?? 'unknown';
  const sessionId = process.env.CLAUDE_SESSION_ID ?? '';
  const agentId = process.env.CLAUDE_AGENT_ID ?? 'main';

  let inputStr: string | undefined;
  const rawInput = process.env.CLAUDE_TOOL_INPUT;
  if (rawInput) {
    inputStr = rawInput.length > MAX_INPUT_LENGTH
      ? rawInput.slice(0, MAX_INPUT_LENGTH)
      : rawInput;
  }

  // Extract file_path from input JSON if possible
  let filePath: string | undefined;
  if (rawInput) {
    try {
      const parsed = JSON.parse(rawInput);
      if (typeof parsed.file_path === 'string') {
        filePath = parsed.file_path;
      } else if (typeof parsed.path === 'string') {
        filePath = parsed.path;
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  sendEvent({
    hook: 'PreToolUse',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      tool_name: toolName,
      tool_input: inputStr,
      file_path: filePath,
    },
  });
}
