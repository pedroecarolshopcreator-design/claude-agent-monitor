#!/bin/bash
# Test script: run from WSL to verify hook -> server connectivity
# Usage: wsl -d Ubuntu -- bash /mnt/c/Users/ADM/Downloads/claude-agent-monitor/scripts/test-wsl-hook.sh

echo "=== CAM WSL Hook Test ==="

# Step 1: Check node
echo -n "1. Node in PATH: "
if command -v node &>/dev/null; then
  echo "YES ($(which node))"
else
  echo "NO - loading nvm..."
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  if command -v node &>/dev/null; then
    echo "   Loaded: $(which node)"
  else
    echo "   FAILED - node not found even after nvm"
    exit 1
  fi
fi

# Step 2: Check server connectivity
echo -n "2. Default gateway: "
GW=$(ip route show default 2>/dev/null | grep -oP 'via \K[\d.]+')
echo "$GW"

echo -n "3. Server via gateway ($GW:7890): "
HTTP_CODE=$(curl -s --connect-timeout 3 -o /dev/null -w '%{http_code}' "http://$GW:7890/api/sessions" 2>/dev/null)
echo "HTTP $HTTP_CODE"

echo -n "4. Server via localhost (7890): "
HTTP_CODE=$(curl -s --connect-timeout 3 -o /dev/null -w '%{http_code}' "http://localhost:7890/api/sessions" 2>/dev/null)
echo "HTTP $HTTP_CODE"

# Step 3: Test hook binary
echo "5. Testing hook binary..."
cd /mnt/c/Users/ADM/Downloads/claude-agent-monitor
RESULT=$(echo '{"session_id":"test-wsl-verify","tool_name":"Read","tool_input":{"file_path":"test.ts"}}' | node packages/hook/dist/index.js pre-tool-use 2>&1)
echo "   Exit: $?"
echo "   Output: ${RESULT:-<empty>}"

# Step 4: Verify event arrived
sleep 1
echo -n "6. Event arrived at server: "
FOUND=$(curl -s --connect-timeout 3 "http://$GW:7890/api/sessions" 2>/dev/null | grep -c "test-wsl-verify")
if [ "$FOUND" -gt 0 ]; then
  echo "YES"
else
  echo "NO"
fi

# Step 5: Test wrapper script
echo "7. Testing wrapper script (bash scripts/cam-hook.sh)..."
RESULT2=$(echo '{"session_id":"test-wsl-wrapper","tool_name":"Edit","tool_input":{"file_path":"test.ts"}}' | bash scripts/cam-hook.sh pre-tool-use 2>&1)
echo "   Exit: $?"
sleep 1
echo -n "8. Wrapper event arrived: "
FOUND2=$(curl -s --connect-timeout 3 "http://$GW:7890/api/sessions" 2>/dev/null | grep -c "test-wsl-wrapper")
if [ "$FOUND2" -gt 0 ]; then
  echo "YES"
else
  echo "NO"
fi

echo ""
echo "=== Test Complete ==="
