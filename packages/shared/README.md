# @claudecam/shared

Shared types, Zod schemas, and constants for [Claude Agent Monitor (CAM)](https://github.com/pedropauloai/claude-agent-monitor) -- Mission Control for Claude Code agents.

[![npm version](https://img.shields.io/npm/v/@claudecam/shared)](https://www.npmjs.com/package/@claudecam/shared)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)

## What This Package Does

Foundation package for the CAM monorepo. Contains all shared TypeScript types, Zod validation schemas, and constants used across the server, hook, CLI, and dashboard packages.

**Includes:**
- TypeScript interfaces for sessions, agents, events, projects, sprints, and tasks
- Zod schemas for runtime validation of hook event payloads
- Shared constants (ports, timeouts, limits)
- Agent palette and color utilities

## Usage

This is an internal package used by other `@claudecam/*` packages. You typically don't install it directly.

```typescript
import { type Session, type AgentEvent, hookEventSchema } from '@claudecam/shared';
```

## Links

- [GitHub Repository](https://github.com/pedropauloai/claude-agent-monitor)
- [Full Documentation](https://github.com/pedropauloai/claude-agent-monitor#readme)
- [CLI Package](https://www.npmjs.com/package/@claudecam/cli)

## License

[MIT](https://github.com/pedropauloai/claude-agent-monitor/blob/main/LICENSE)
