import { sendEvent } from "../transport.js";

export function handleSubagentStop(stdinData: Record<string, unknown>): void {
  const sessionId = (stdinData["session_id"] as string) ?? "";
  const stopHookActive = stdinData["stop_hook_active"] as boolean | undefined;

  sendEvent({
    hook: "SubagentStop",
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    agent_id: sessionId || "main",
    data: {
      reason: stopHookActive ? "stop_hook" : "shutdown_approved",
      stop_hook_active: stopHookActive,
    },
  });
}
