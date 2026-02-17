#!/bin/bash
# CAM Hook Wrapper - Cross-platform (Windows MINGW64 + WSL Ubuntu)
# Ensures node is available (loads nvm if needed) and runs the hook binary.
# Reads stdin from Claude Code and passes it through to the hook.
#
# Uses $CLAUDE_PROJECT_DIR (set by Claude Code) for absolute path resolution.

# Resolve hook script path
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  HOOK_SCRIPT="$CLAUDE_PROJECT_DIR/packages/hook/dist/index.js"
else
  HOOK_SCRIPT="packages/hook/dist/index.js"
fi

# If node is already in PATH, use it directly
if command -v node &>/dev/null; then
  exec node "$HOOK_SCRIPT" "$@"
fi

# Try loading nvm (WSL/Linux with nvm)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh" 2>/dev/null
  if command -v node &>/dev/null; then
    exec node "$HOOK_SCRIPT" "$@"
  fi
fi

# Last resort: try common node paths
for NODE_PATH in \
  "$HOME/.nvm/versions/node/"*/bin/node \
  /usr/local/bin/node \
  /usr/bin/node; do
  if [ -x "$NODE_PATH" ]; then
    exec "$NODE_PATH" "$HOOK_SCRIPT" "$@"
  fi
done

# Failed silently - don't block Claude Code
exit 0
