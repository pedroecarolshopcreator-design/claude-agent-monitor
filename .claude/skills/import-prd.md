---
name: import-prd
description: Import or re-import the PRD into CAM server
---

Import the PRD file into the running CAM server: $ARGUMENTS

Default file: PRD.md in project root.

1. Read the PRD file
2. POST to http://localhost:7890/api/projects with:
   ```json
   { "name": "<project name from PRD>", "prdContent": "<file content>" }
   ```
3. Verify response shows parsed tasks and sprints
4. Report: number of tasks, sprints, and any parsing issues
