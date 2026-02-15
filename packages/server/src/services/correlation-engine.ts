import { randomUUID } from 'node:crypto';
import type { AgentEvent } from '@cam/shared';
import { TASK_TOOLS } from '@cam/shared';
import { prdTaskQueries, taskActivityQueries, projectQueries } from '../db/queries.js';
import { updateTask } from './project-manager.js';
import { sseManager } from './sse-manager.js';

interface PrdTaskRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  assigned_agent: string | null;
  external_id: string | null;
}

function fuzzyMatch(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 1.0;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;

  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  let matchingWords = 0;
  for (const aw of aWords) {
    if (aw.length < 3) continue;
    for (const bw of bWords) {
      if (bw.includes(aw) || aw.includes(bw)) {
        matchingWords++;
        break;
      }
    }
  }

  const total = Math.max(aWords.length, bWords.length);
  if (total === 0) return 0;
  return matchingWords / total;
}

export function correlateEvent(event: AgentEvent): void {
  if (!event.tool || !(TASK_TOOLS as readonly string[]).includes(event.tool)) {
    return;
  }

  const meta = event.metadata as Record<string, unknown> | undefined;
  if (!meta) return;

  const toolInput = (meta['tool_input'] ?? meta) as Record<string, unknown>;

  try {
    if (event.tool === 'TaskCreate') {
      handleTaskCreate(event, toolInput);
    } else if (event.tool === 'TaskUpdate') {
      handleTaskUpdate(event, toolInput);
    }
  } catch {
    // Correlation errors should not break event processing
  }
}

function handleTaskCreate(event: AgentEvent, input: Record<string, unknown>): void {
  const subject = (input['subject'] as string) || '';
  if (!subject) return;

  // Search all projects for matching PRD tasks
  const projects = projectQueries.getAll().all() as Array<{ id: string }>;

  for (const project of projects) {
    const tasks = prdTaskQueries.getByProject().all(project.id) as PrdTaskRow[];

    let bestMatch: PrdTaskRow | null = null;
    let bestScore = 0;

    for (const task of tasks) {
      const score = fuzzyMatch(subject, task.title);
      if (score > bestScore && score >= 0.6) {
        bestMatch = task;
        bestScore = score;
      }
    }

    if (bestMatch) {
      // Link via external ID
      prdTaskQueries.update().run(
        null, null, null, null, event.id,
        null, null, event.sessionId,
        new Date().toISOString(),
        bestMatch.id
      );

      // Record activity
      taskActivityQueries.insert().run(
        randomUUID(),
        bestMatch.id,
        event.id,
        event.sessionId,
        event.agentId,
        'task_created',
        event.timestamp,
        `Matched with TaskCreate: "${subject}" (confidence: ${(bestScore * 100).toFixed(0)}%)`
      );

      sseManager.broadcast('correlation_match', {
        eventId: event.id,
        taskId: bestMatch.id,
        confidence: bestScore,
        reason: `TaskCreate subject fuzzy match: "${subject}"`,
      });

      break;
    }
  }
}

function handleTaskUpdate(event: AgentEvent, input: Record<string, unknown>): void {
  const taskId = input['taskId'] as string;
  const status = input['status'] as string;
  const owner = input['owner'] as string;

  if (!taskId) return;

  // Search all projects for a task with matching external ID
  const projects = projectQueries.getAll().all() as Array<{ id: string }>;

  for (const project of projects) {
    const tasks = prdTaskQueries.getByProject().all(project.id) as PrdTaskRow[];

    const matchedTask = tasks.find(t => t.external_id === taskId);
    if (!matchedTask) continue;

    const updates: Record<string, string | undefined> = {};

    if (status === 'in_progress') {
      updates['status'] = 'in_progress';
    } else if (status === 'completed') {
      updates['status'] = 'completed';
    }

    if (owner) {
      updates['assignedAgent'] = owner;
    }

    if (Object.keys(updates).length > 0) {
      updateTask(matchedTask.id, updates);
    }

    // Record activity
    const activityType = status === 'completed' ? 'task_completed'
                       : status === 'in_progress' ? 'task_started'
                       : owner ? 'agent_assigned'
                       : 'manual_update';

    taskActivityQueries.insert().run(
      randomUUID(),
      matchedTask.id,
      event.id,
      event.sessionId,
      event.agentId,
      activityType,
      event.timestamp,
      `TaskUpdate: status=${status || 'unchanged'}, owner=${owner || 'unchanged'}`
    );

    sseManager.broadcast('correlation_match', {
      eventId: event.id,
      taskId: matchedTask.id,
      confidence: 1.0,
      reason: `TaskUpdate externalId exact match`,
    });

    break;
  }
}
