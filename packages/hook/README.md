# @claudecam/hook

Ultra-lightweight hook binary for [Claude Agent Monitor (CAM)](https://github.com/pedropauloai/claude-agent-monitor) -- Mission Control for Claude Code agents.

[![npm version](https://img.shields.io/npm/v/@claudecam/hook)](https://www.npmjs.com/package/@claudecam/hook)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)

## What This Package Does

Captures Claude Code hook events and sends them to the CAM server. Designed to be as fast and invisible as possible.

**Key properties:**
- **Zero external dependencies** -- uses only native Node.js `http` module
- **< 10ms latency** -- never blocks Claude Code
- **Fails silently** -- if the CAM server is down, nothing breaks
- **WSL auto-detection** -- automatically resolves Windows host IP when running in WSL
- **Retry with fallback** -- tries configured host, then localhost, then 127.0.0.1

## Hook Events Captured

| Hook | When it fires |
|------|--------------|
| `SessionStart` | Claude Code session begins |
| `SessionEnd` | Session ends |
| `PreToolUse` | Before every tool call |
| `PostToolUse` | After tool call completes |
| `PostToolUseFailure` | When a tool call fails |
| `UserPromptSubmit` | User sends a prompt |
| `Notification` | Claude Code notification |
| `Stop` | Main agent stops |
| `SubagentStart` | Teammate agent starts |
| `SubagentStop` | Teammate agent stops |

## Usage

This package is configured automatically by `@claudecam/cli`. You typically don't install it directly.

```bash
# Recommended: let the CLI handle everything
npx @claudecam/cli start
```

## Debug Mode

```bash
export CAM_DEBUG=1
# Hook will log connection attempts and payloads to stderr
```

## Links

- [GitHub Repository](https://github.com/pedropauloai/claude-agent-monitor)
- [Full Documentation](https://github.com/pedropauloai/claude-agent-monitor#readme)
- [CLI Package](https://www.npmjs.com/package/@claudecam/cli)

## License

[MIT](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)
