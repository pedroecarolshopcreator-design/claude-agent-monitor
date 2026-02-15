import { MAX_INPUT_LENGTH, MAX_OUTPUT_LENGTH } from '@cam/shared';
import { sendEvent } from '../transport.js';

export function handlePostToolUse(): void {
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

  let outputStr: string | undefined;
  const rawOutput = process.env.CLAUDE_TOOL_OUTPUT;
  if (rawOutput) {
    outputStr = rawOutput.length > MAX_OUTPUT_LENGTH
      ? rawOutput.slice(0, MAX_OUTPUT_LENGTH)
      : rawOutput;
  }

  const durationStr = process.env.CLAUDE_TOOL_DURATION_MS;
  const duration = durationStr ? parseInt(durationStr, 10) : undefined;

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

  // Check for error in output
  let error: string | undefined;
  const rawError = process.env.CLAUDE_TOOL_ERROR;
  if (rawError) {
    error = rawError.length > MAX_OUTPUT_LENGTH
      ? rawError.slice(0, MAX_OUTPUT_LENGTH)
      : rawError;
  }

  sendEvent({
    hook: 'PostToolUse',
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: agentId,
    data: {
      tool_name: toolName,
      tool_input: inputStr,
      tool_output: outputStr,
      file_path: filePath,
      duration_ms: duration,
      error,
    },
  });
}
