import { Router } from 'express';
import type { Request, Response } from 'express';
import { sessionQueries, eventQueries, fileChangeQueries } from '../db/queries.js';

export const statsRouter = Router();

interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  event_count: number;
}

// GET /api/sessions/:id/stats
statsRouter.get('/:id/stats', (req: Request, res: Response) => {
  try {
    const sessionId = req.params['id']!;
    const session = sessionQueries.getById().get(sessionId) as SessionRow | undefined;

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const startTime = new Date(session.started_at).getTime();
    const endTime = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    const toolBreakdown = eventQueries.getToolBreakdown().all(sessionId) as Array<{ tool: string; count: number }>;
    const toolsMap: Record<string, number> = {};
    let totalToolCalls = 0;
    for (const row of toolBreakdown) {
      toolsMap[row.tool] = row.count;
      totalToolCalls += row.count;
    }

    const agentBreakdownRows = eventQueries.getAgentBreakdown().all(sessionId) as Array<{ agent_id: string; events: number; errors: number }>;
    const agentsMap: Record<string, { events: number; errors: number }> = {};
    let totalErrors = 0;
    for (const row of agentBreakdownRows) {
      agentsMap[row.agent_id] = { events: row.events, errors: row.errors };
      totalErrors += row.errors;
    }

    const fileChanges = fileChangeQueries.getBySession().all(sessionId) as Array<Record<string, unknown>>;
    let filesModified = 0;
    let filesCreated = 0;
    let filesRead = 0;
    for (const fc of fileChanges) {
      const ct = fc['change_type'] as string;
      if (ct === 'modified') filesModified++;
      else if (ct === 'created') filesCreated++;
      else if (ct === 'read') filesRead++;
    }

    const timeline = eventQueries.getTimeline().all(sessionId) as Array<{ minute: string; events: number }>;

    const compactEvents = eventQueries.getBySessionAndCategory().all(sessionId, 'compact', 100, 0) as unknown[];

    res.json({
      duration_seconds: durationSeconds,
      total_events: session.event_count,
      total_tool_calls: totalToolCalls,
      total_errors: totalErrors,
      tools_breakdown: toolsMap,
      agents_breakdown: agentsMap,
      files_modified: filesModified,
      files_created: filesCreated,
      files_read: filesRead,
      compactions: compactEvents.length,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
