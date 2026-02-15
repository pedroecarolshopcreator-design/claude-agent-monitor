import express from 'express';
import cors from 'cors';
import { DEFAULT_SERVER_PORT, DEFAULT_HOST } from '@cam/shared';
import { initDb, closeDb } from './db/index.js';
import { sseManager } from './services/sse-manager.js';

// Routes
import { eventsRouter } from './routes/events.js';
import { sessionsRouter } from './routes/sessions.js';
import { agentsRouter } from './routes/agents.js';
import { filesRouter } from './routes/files.js';
import { statsRouter } from './routes/stats.js';
import { streamRouter } from './routes/stream.js';
import { projectsRouter } from './routes/projects.js';
import { sprintsRouter } from './routes/sprints.js';
import { tasksRouter } from './routes/tasks.js';
import { parsePrdRouter } from './routes/parse-prd.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      connections: sseManager.getConnectionCount(),
    });
  });

  // Pilar 1 routes
  app.use('/api/events', eventsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/sessions', agentsRouter);     // /api/sessions/:id/agents
  app.use('/api/sessions', filesRouter);      // /api/sessions/:id/files
  app.use('/api/sessions', statsRouter);      // /api/sessions/:id/stats
  app.use('/api/sessions', eventsRouter);     // /api/sessions/:id/events (mounted on eventsRouter)
  app.use('/api/stream', streamRouter);

  // Pilar 2 routes
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects', sprintsRouter);    // /api/projects/:id/sprints
  app.use('/api/projects', tasksRouter);      // /api/projects/:id/tasks
  app.use('/api/parse-prd', parsePrdRouter);

  return app;
}

export function startServer(options?: { port?: number; dbPath?: string }) {
  const port = options?.port ?? DEFAULT_SERVER_PORT;

  // Initialize database
  initDb(options?.dbPath);

  const app = createApp();

  const server = app.listen(port, DEFAULT_HOST, () => {
    console.log(`Claude Agent Monitor server running at http://${DEFAULT_HOST}:${port}`);
    console.log(`  API:    http://${DEFAULT_HOST}:${port}/api/health`);
    console.log(`  SSE:    http://${DEFAULT_HOST}:${port}/api/stream`);
    console.log(`  Events: POST http://${DEFAULT_HOST}:${port}/api/events`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    sseManager.shutdown();
    server.close(() => {
      closeDb();
      process.exit(0);
    });

    // Force exit after 5 seconds
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

// Start server when run directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('index.js')
);

if (isMain) {
  const port = parseInt(process.env['CAM_PORT'] || '') || DEFAULT_SERVER_PORT;
  const dbPath = process.env['CAM_DB_PATH'] || undefined;
  startServer({ port, dbPath });
}
