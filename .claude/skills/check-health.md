---
name: check-health
description: Verify CAM system health - build, types, server, dashboard
---

Run a full health check on CAM:

1. `pnpm typecheck` - verify all packages compile
2. `pnpm build` - verify build works
3. Check if server responds: `curl http://localhost:7890/api/sessions`
4. Check if dashboard responds: `curl http://localhost:7891`
5. Check SQLite database exists and has tables
6. Report status of each check (pass/fail)
