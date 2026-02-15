import { Router } from 'express';
import type { Request, Response } from 'express';
import { fileChangeQueries } from '../db/queries.js';

export const filesRouter = Router();

interface FileChangeRow {
  file_path: string;
  session_id: string;
  agent_id: string;
  change_type: string;
  first_touched_at: string;
  last_touched_at: string;
  touch_count: number;
}

// GET /api/sessions/:id/files
filesRouter.get('/:id/files', (req: Request, res: Response) => {
  try {
    const sessionId = req.params['id']!;
    const rows = fileChangeQueries.getBySession().all(sessionId) as FileChangeRow[];

    const files = rows.map(row => ({
      filePath: row.file_path,
      sessionId: row.session_id,
      agentId: row.agent_id,
      changeType: row.change_type,
      firstTouchedAt: row.first_touched_at,
      lastTouchedAt: row.last_touched_at,
      touchCount: row.touch_count,
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
