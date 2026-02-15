import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SERVER_PORT, DEFAULT_DASHBOARD_PORT } from '@cam/shared';
import { logger } from '../utils/logger.js';
import { writeConfig } from '../utils/config.js';

export const startCommand = new Command('start')
  .description('Start the Claude Agent Monitor server and dashboard')
  .option('-p, --port <port>', 'Server port', String(DEFAULT_SERVER_PORT))
  .option('-d, --dashboard-port <port>', 'Dashboard port', String(DEFAULT_DASHBOARD_PORT))
  .option('-t, --theme <theme>', 'Dashboard theme: pixel, modern, terminal', 'modern')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options: {
    port: string;
    dashboardPort: string;
    theme: string;
    open: boolean;
  }) => {
    const serverPort = parseInt(options.port, 10);
    const dashboardPort = parseInt(options.dashboardPort, 10);

    if (isNaN(serverPort) || serverPort < 1 || serverPort > 65535) {
      logger.error(`Invalid server port: ${options.port}`);
      process.exit(1);
    }

    if (isNaN(dashboardPort) || dashboardPort < 1 || dashboardPort > 65535) {
      logger.error(`Invalid dashboard port: ${options.dashboardPort}`);
      process.exit(1);
    }

    // Save config
    writeConfig({
      serverPort,
      dashboardPort,
      theme: options.theme,
    });

    logger.banner();

    // Check if server is already running
    try {
      const response = await fetch(`http://localhost:${serverPort}/api/sessions`);
      if (response.ok) {
        logger.warning(`Server is already running on port ${serverPort}`);
        logger.info(`Dashboard: ${chalk.cyan(`http://localhost:${dashboardPort}`)}`);
        logger.blank();
        return;
      }
    } catch {
      // Server not running, proceed to start
    }

    // Resolve the server package entry point
    let serverEntryPoint: string;
    try {
      const require = createRequire(import.meta.url);
      serverEntryPoint = require.resolve('@cam/server');
    } catch {
      // Fallback: try relative path in monorepo
      const thisDir = import.meta.url;
      const serverUrl = new URL('../../../server/dist/index.js', thisDir);
      serverEntryPoint = fileURLToPath(serverUrl);
    }

    logger.keyValue('Server', `http://localhost:${serverPort}`);
    logger.keyValue('Dashboard', `http://localhost:${dashboardPort}`);
    logger.keyValue('Theme', options.theme);
    logger.blank();

    // Start server process
    const env = {
      ...process.env,
      CAM_SERVER_PORT: String(serverPort),
      CAM_DASHBOARD_PORT: String(dashboardPort),
      CAM_THEME: options.theme,
      NODE_ENV: process.env.NODE_ENV ?? 'production',
    };

    const serverProcess = spawn('node', [serverEntryPoint], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    serverProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          logger.info(line.trim());
        }
      }
    });

    serverProcess.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          logger.error(line.trim());
        }
      }
    });

    serverProcess.on('error', (err) => {
      logger.error(`Failed to start server: ${err.message}`);
      logger.info('Make sure @cam/server is built. Run: pnpm --filter @cam/server build');
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        logger.error(`Server exited with code ${code}`);
        process.exit(code);
      }
      logger.info('Server stopped.');
      process.exit(0);
    });

    // Open browser after a short delay
    if (options.open) {
      setTimeout(() => {
        const url = `http://localhost:${dashboardPort}`;
        openBrowser(url);
      }, 1500);
    }

    logger.info('Waiting for Claude Code events...');
    logger.info(chalk.gray('(Press Ctrl+C to stop)'));
    logger.blank();

    // Handle graceful shutdown
    const shutdown = () => {
      logger.blank();
      logger.info('Shutting down...');
      serverProcess.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
        process.exit(0);
      }, 5000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  try {
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  } catch {
    // Silently fail if browser can't be opened
  }
}
