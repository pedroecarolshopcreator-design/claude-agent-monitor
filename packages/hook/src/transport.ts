import { request } from 'node:http';
import { DEFAULT_SERVER_PORT, DEFAULT_HOST } from '@cam/shared';

/**
 * Sends an event payload to the CAM server via HTTP POST.
 * Uses native Node.js http module for minimal startup overhead.
 * Fails silently if server is not running - never blocks Claude Code.
 * Timeout: 2s max.
 */
export function sendEvent(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);

  const req = request(
    {
      hostname: DEFAULT_HOST,
      port: DEFAULT_SERVER_PORT,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 2000,
    },
    (res) => {
      // Drain response to free socket
      res.resume();
    },
  );

  // Fail silently on any error
  req.on('error', () => {});
  req.on('timeout', () => {
    req.destroy();
  });

  req.write(body);
  req.end();
}
