import { sendEvent } from "../transport.js";

export function handleStop(stdinData: Record<string, unknown>): void {
  const sessionId = (stdinData["session_id"] as string) ?? "";
  const stopHookActive = stdinData["stop_hook_active"] as boolean | undefined;

  sendEvent({
    hook: "Stop",
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: sessionId || "main",
    data: {
      reason: stopHookActive ? "stop_hook" : "natural",
      stop_type: "natural",
      stop_hook_active: stopHookActive,
    },
  });
}
