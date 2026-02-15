#!/usr/bin/env node

import { handlePreToolUse } from './handlers/pre-tool-use.js';
import { handlePostToolUse } from './handlers/post-tool-use.js';
import { handleNotification } from './handlers/notification.js';
import { handleStop } from './handlers/stop.js';
import { handleSubagentStop } from './handlers/subagent-stop.js';
import { handlePreCompact, handlePostCompact } from './handlers/compact.js';

const command = process.argv[2];

switch (command) {
  case 'pre-tool-use':
    handlePreToolUse();
    break;
  case 'post-tool-use':
    handlePostToolUse();
    break;
  case 'notification':
    handleNotification();
    break;
  case 'stop':
    handleStop();
    break;
  case 'subagent-stop':
    handleSubagentStop();
    break;
  case 'pre-compact':
    handlePreCompact();
    break;
  case 'post-compact':
    handlePostCompact();
    break;
  default:
    // Unknown command - fail silently, exit 0
    break;
}
