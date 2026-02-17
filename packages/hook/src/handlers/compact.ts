import { sendEvent } from "../transport.js";

export function handlePreCompact(stdinData: Record<string, unknown>): void {
  const sessionId = (stdinData["session_id"] as string) ?? "";
  const trigger = (stdinData["trigger"] as string) ?? "unknown";

  sendEvent({
    hook: "PreCompact",
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: sessionId || "main",
    data: {
      trigger,
    },
  });
}

export function handlePostCompact(stdinData: Record<string, unknown>): void {
  const sessionId = (stdinData["session_id"] as string) ?? "";

  sendEvent({
    hook: "PostCompact",
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: sessionId || "main",
    data: {
      // PostCompact data from Claude Code stdin - extract what's available
      summary: stdinData["summary"] ?? null,
    },
  });
}
