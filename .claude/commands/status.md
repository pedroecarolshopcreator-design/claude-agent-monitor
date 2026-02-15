Show current project status:

1. Check if server is running (curl http://localhost:7890/api/sessions)
2. Check if dashboard is running (curl http://localhost:7891)
3. Query active project: GET http://localhost:7890/api/projects
4. Query sprint progress: GET http://localhost:7890/api/sprints
5. Query task summary: GET http://localhost:7890/api/tasks (count by status)
6. Show a summary table with: total tasks, completed, in progress, blocked
