#!/usr/bin/env node

/**
 * Thin wrapper that delegates to @cam/hook's entry point.
 * This ensures cam-hook is available in PATH when @cam/cli is installed globally.
 * The @cam/hook index.ts reads process.argv and stdin at module level.
 */
import "@cam/hook";
