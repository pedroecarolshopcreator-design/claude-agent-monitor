import { Command } from 'commander';
import chalk from 'chalk';
import { DEFAULT_SERVER_PORT } from '@cam/shared';
import { logger } from '../utils/logger.js';
import { readConfig } from '../utils/config.js';

interface SessionData {
  id: string;
  startedAt: string;
  status: string;
  agentCount: number;
  eventCount: number;
}

interface SessionsResponse {
  sessions: SessionData[];
}

export const statusCommand = new Command('status')
  .description('Show Claude Agent Monitor server status')
  .action(async () => {
    const config = readConfig();
    const port = config.serverPort || DEFAULT_SERVER_PORT;

    logger.blank();
    logger.section('Claude Agent Monitor - Status');
    logger.blank();

    try {
      const response = await fetch(`http://localhost:${port}/api/sessions`);

      if (!response.ok) {
        logger.error(`Server responded with status ${response.status}`);
        process.exit(1);
      }

      const data = (await response.json()) as SessionsResponse;

      logger.keyValue('Status', chalk.green('Running'));
      logger.keyValue('Server', chalk.cyan(`http://localhost:${port}`));
      logger.blank();

      const activeSessions = data.sessions.filter((s) => s.status === 'active');
      const totalSessions = data.sessions.length;

      logger.section('Sessions');
      logger.keyValue('Active', chalk.yellow(String(activeSessions.length)));
      logger.keyValue('Total', String(totalSessions));
      logger.blank();

      if (activeSessions.length > 0) {
        logger.section('Active Sessions');
        for (const session of activeSessions) {
          const elapsed = getElapsed(session.startedAt);
          logger.blank();
          logger.keyValue('  Session', chalk.cyan(session.id));
          logger.keyValue('  Started', `${elapsed} ago`);
          logger.keyValue('  Agents', String(session.agentCount));
          logger.keyValue('  Events', String(session.eventCount));
        }
      } else {
        logger.info('No active sessions. Waiting for Claude Code events...');
      }
    } catch {
      logger.keyValue('Status', chalk.red('Offline'));
      logger.blank();
      logger.info(`Server is not running on port ${port}.`);
      logger.info(`Start with: ${chalk.cyan('cam start')}`);
    }

    logger.blank();
  });

function getElapsed(isoTimestamp: string): string {
  const start = new Date(isoTimestamp).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
