# @claudecam/cli

**Mission Control for Claude Code agents.** Real-time observability + visual Sprint tracking.

Watch your AI agents work. Learn how they build. Ship faster.

[![npm version](https://img.shields.io/npm/v/@claudecam/cli)](https://www.npmjs.com/package/@claudecam/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)

## Quick Start

```bash
cd your-project
npx @claudecam/cli start

# In another terminal, use Claude Code normally
claude "implement the auth module"

# Open http://localhost:7890 and watch everything in real-time
```

Or install globally:

```bash
npm install -g @claudecam/cli

cd your-project
cam start
```

`cam start` automatically configures hooks, scaffolds doc templates, and registers the project. One command and you're ready.

## What You Get

| Feature | Description |
|---------|-------------|
| **Real-time Activity Feed** | Every tool call, file edit, bash command streamed live |
| **Agent Map** | 3D robot visualization of your agents on a "Mission Floor" |
| **File Watcher** | Track every file created, modified, or read per agent |
| **Kanban Board** | Auto-updating task board synced with Claude's TaskCreate/TaskUpdate |
| **Sprint Tracking** | Import sprint files, track progress, burndown charts |
| **3 Themes** | Modern (default), Terminal (green-on-black), Pixel Art (retro RPG) |
| **Multi-Agent** | Full per-agent tracking with tmux + Claude Code Teams |

## How It Works

```
You use Claude Code normally
        |
        | hooks fire automatically
        v
+-----------------+     POST      +------------------+
|   cam-hook      | -----------> |   CAM Server     |
|   (< 10ms)      |              |   (Express +     |
|   zero deps     |              |    SQLite)       |
+-----------------+              +--------+---------+
                                          |
                            +-------------+-------------+
                            |                           |
                            v                           v
                   +----------------+         +------------------+
                   |   Dashboard    |         |   Correlation    |
                   |   (React +     |         |   Engine         |
                   |    real-time)  |         |   (auto-links    |
                   +----------------+         |    to tasks)     |
                                              +------------------+
```

The hook binary is ultra-fast (< 10ms) and fails silently. It **never** blocks Claude Code.

## CLI Commands

```bash
cam start                    # Start server + dashboard (opens browser)
cam start --port 8080        # Custom server port
cam status                   # Show projects, sessions, health
cam doctor                   # Diagnose common issues

cam sprint list              # List sprints in active project
cam sprint sync              # Import all sprint files from docs/SPRINTS/
cam sprint import <file>     # Import tasks from a sprint markdown file
cam tasks                    # List tasks in active sprint

cam project list             # List all projects
cam project show             # Show active project with stats
cam sessions                 # List previous sessions
```

## Sprint Tracking (optional)

```bash
# Create a sprint file from the template
cp docs/SPRINTS/TEMPLATE.md docs/SPRINTS/sprint-01.md
# Edit sprint-01.md with your tasks

# Import all sprint files
cam sprint sync
```

Tasks move automatically on the Kanban board as agents call `TaskCreate` and `TaskUpdate`.

## Multi-Agent Setup

For full per-agent tracking, use Claude Code Teams with tmux:

```bash
cam start
tmux new-session -s dev
claude "implement Sprint 1 using a team of agents"
```

Each agent runs as a separate process with its own session. CAM tracks them all individually.

## Packages

This CLI is the main entry point for the [Claude Agent Monitor](https://github.com/pedropauloai/claude-agent-monitor) monorepo:

| Package | Description |
|---------|-------------|
| `@claudecam/cli` | CLI commands (this package) |
| `@claudecam/server` | Express + SQLite + REST API + SSE |
| `@claudecam/hook` | Ultra-light hook binary (zero external deps) |
| `@claudecam/dashboard` | React 19 dashboard with 3 themes |
| `@claudecam/shared` | Shared types, Zod schemas, constants |

## Links

- [GitHub Repository](https://github.com/pedropauloai/claude-agent-monitor)
- [Full Documentation](https://github.com/pedropauloai/claude-agent-monitor#readme)
- [Issues](https://github.com/pedropauloai/claude-agent-monitor/issues)

## License

[MIT](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)
