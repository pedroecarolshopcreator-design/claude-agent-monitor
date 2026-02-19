# @claudecam/dashboard

React dashboard for [Claude Agent Monitor (CAM)](https://github.com/pedropauloai/claude-agent-monitor) -- Mission Control for Claude Code agents.

[![npm version](https://img.shields.io/npm/v/@claudecam/dashboard)](https://www.npmjs.com/package/@claudecam/dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)

## What This Package Does

Real-time monitoring dashboard that visualizes Claude Code agent activity. Built with React 19, Vite, Tailwind CSS, and Zustand.

**Key features:**
- **3 Themes** -- Modern (clean dark UI), Terminal (green-on-black), Pixel Art (retro RPG)
- **Agent Map** -- 3D robot visualization with Spline models on a "Mission Floor"
- **Real-time Activity Feed** -- Every tool call, file edit, and command streamed via SSE
- **Kanban Board** -- Auto-updating task board synced with sprint tracking
- **Burndown Chart** -- Sprint progress with ideal vs actual lines
- **Multi-project sidebar** -- Switch between projects
- **Resizable panels** -- Customizable layout with drag-to-resize

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 6 | Build tool |
| Tailwind CSS 4 | Styling |
| Zustand 5 | State management |
| Recharts | Charts and graphs |
| Framer Motion | Animations |
| Spline | 3D robot models |
| React Three Fiber | 3D indicator overlays |

## Usage

This package is served automatically by `@claudecam/cli`. You typically don't install it directly.

```bash
# Recommended: use the CLI
npx @claudecam/cli start
# Dashboard opens at http://localhost:7890
```

## Links

- [GitHub Repository](https://github.com/pedropauloai/claude-agent-monitor)
- [Full Documentation](https://github.com/pedropauloai/claude-agent-monitor#readme)
- [CLI Package](https://www.npmjs.com/package/@claudecam/cli)

## License

[MIT](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)
