import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { randomUUID } from 'node:crypto';
import { sseManager } from '../services/sse-manager.js';

export const streamRouter: RouterType = Router();

// GET /api/stream - SSE endpoint
streamRouter.get('/', (req: Request, res: Response) => {
  const clientId = randomUUID();
  const sessionFilter = req.query['session_id'] as string | undefined;

  // Disable request timeout for SSE connections
  req.setTimeout(0);

  sseManager.addClient(clientId, res, sessionFilter);

  // The SSE manager handles everything from here:
  // - Initial connected event
  // - Heartbeat every 15s
  // - Cleanup on close
});
