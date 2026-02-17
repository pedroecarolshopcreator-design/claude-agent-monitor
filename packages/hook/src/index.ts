#!/usr/bin/env node

/**
 * CAM Hook - Ultra-light binary called by Claude Code hooks.
 *
 * Claude Code passes hook data via STDIN as JSON:
 * {
 *   "session_id": "abc123",
 *   "hook_event_name": "PostToolUse",
 *   "tool_name": "Edit",
 *   "tool_input": { "file_path": "/src/index.ts" },
 *   "tool_response": { ... }
 * }
 *
 * We read stdin, parse JSON, and route to the appropriate handler.
 */

import { handlePreToolUse } from "./handlers/pre-tool-use.js";
import { handlePostToolUse } from "./handlers/post-tool-use.js";
import { handleNotification } from "./handlers/notification.js";
import { handleStop } from "./handlers/stop.js";
import { handleSubagentStop } from "./handlers/subagent-stop.js";
import { handleSubagentStart } from "./handlers/subagent-start.js";
import { handlePreCompact, handlePostCompact } from "./handlers/compact.js";
import { handleSessionStart } from "./handlers/session-start.js";
import { handleSessionEnd } from "./handlers/session-end.js";
import { handleUserPromptSubmit } from "./handlers/user-prompt-submit.js";

const command = process.argv[2];

// Read all stdin, parse as JSON, then route to handler
const chunks: Buffer[] = [];
process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
process.stdin.on("end", () => {
  let stdinData: Record<string, unknown> = {};
  try {
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (raw) {
      stdinData = JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    // Failed to parse stdin - continue with empty data
  }

  switch (command) {
    case "pre-tool-use":
      handlePreToolUse(stdinData);
      break;
    case "post-tool-use":
      handlePostToolUse(stdinData);
      break;
    case "notification":
      handleNotification(stdinData);
      break;
    case "stop":
      handleStop(stdinData);
      break;
    case "subagent-stop":
      handleSubagentStop(stdinData);
      break;
    case "subagent-start":
      handleSubagentStart(stdinData);
      break;
    case "pre-compact":
      handlePreCompact(stdinData);
      break;
    case "post-compact":
      handlePostCompact(stdinData);
      break;
    case "session-start":
      handleSessionStart(stdinData);
      break;
    case "session-end":
      handleSessionEnd(stdinData);
      break;
    case "user-prompt-submit":
      handleUserPromptSubmit(stdinData);
      break;
    default:
      // Unknown command - fail silently, exit 0
      break;
  }
});

// If stdin closes immediately (no data), handle it
process.stdin.on("error", () => {});

// Timeout: if stdin doesn't close in 5s, exit gracefully.
// Increased from 3s to 5s to allow transport retries with fallback hosts.
setTimeout(() => process.exit(0), 5000);
