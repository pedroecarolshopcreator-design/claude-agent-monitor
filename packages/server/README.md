# @claudecam/server

Backend server for [Claude Agent Monitor (CAM)](https://github.com/pedropauloai/claude-agent-monitor) -- Mission Control for Claude Code agents.

[![npm version](https://img.shields.io/npm/v/@claudecam/server)](https://www.npmjs.com/package/@claudecam/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)

## What This Package Does

Express server with SQLite persistence, REST API, and Server-Sent Events (SSE) for real-time agent monitoring. Receives hook events from Claude Code, stores them, and streams updates to the dashboard.

**Key features:**
- REST API for sessions, agents, events, projects, sprints, and tasks
- SSE streaming for real-time dashboard updates
- SQLite (WAL mode) for concurrent reads
- Correlation Engine that auto-links tool events to sprint tasks
- Multi-project support with project registry

## Usage

This package is used internally by `@claudecam/cli`. You typically don't install it directly.

```bash
# Recommended: use the CLI
npx @claudecam/cli start

# Or programmatic usage
import { startServer } from '@claudecam/server';
startServer({ port: 7890 });
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/events` | Ingest hook events |
| `GET` | `/api/sessions` | List sessions |
| `GET` | `/api/sessions/:id` | Session details with agents |
| `GET` | `/api/sessions/:id/agents` | Agents in a session |
| `GET` | `/api/sessions/:id/events` | Events with filters |
| `GET` | `/api/sessions/:id/files` | File changes |
| `GET` | `/api/stream` | SSE real-time stream |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/projects/:id/tasks` | Tasks with filters |

## Links

- [GitHub Repository](https://github.com/pedropauloai/claude-agent-monitor)
- [Full Documentation](https://github.com/pedropauloai/claude-agent-monitor#readme)
- [CLI Package](https://www.npmjs.com/package/@claudecam/cli)

## License

[MIT](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)
