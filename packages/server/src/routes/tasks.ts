import { Router } from 'express';
import type { Request, Response } from 'express';
import { updateTaskRequestSchema } from '@cam/shared';
import {
  listTasks,
  getTask,
  updateTask,
  getTaskStatusSummary,
  getProject,
} from '../services/project-manager.js';
import { taskActivityQueries } from '../db/queries.js';

export const tasksRouter = Router();

// GET /api/projects/:id/tasks
tasksRouter.get('/:id/tasks', (req: Request, res: Response) => {
  try {
    const projectId = String(req.params['id']);
    const project = getProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const filters = {
      sprintId: req.query['sprint_id'] as string | undefined,
      status: req.query['status'] as string | undefined,
      agent: req.query['agent'] as string | undefined,
      priority: req.query['priority'] as string | undefined,
    };

    const tasks = listTasks(projectId, filters);
    const summary = getTaskStatusSummary(projectId);

    res.json({ tasks, summary });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/projects/:projectId/tasks/:taskId
tasksRouter.patch('/:projectId/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const taskId = String(req.params['taskId']);
    const parsed = updateTaskRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const updated = updateTask(taskId, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task: updated });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/tasks/:taskId/activity
tasksRouter.get('/:id/tasks/:taskId/activity', (req: Request, res: Response) => {
  try {
    const taskId = String(req.params['taskId']);
    const task = getTask(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const rows = taskActivityQueries.getByTask().all(taskId) as Array<Record<string, unknown>>;
    const activities = rows.map(row => ({
      id: row['id'],
      prdTaskId: row['prd_task_id'],
      eventId: row['event_id'],
      sessionId: row['session_id'],
      agentId: row['agent_id'],
      activityType: row['activity_type'],
      timestamp: row['timestamp'],
      details: row['details'] ?? undefined,
    }));

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
