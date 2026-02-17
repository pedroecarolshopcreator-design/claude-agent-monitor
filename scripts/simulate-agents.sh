#!/bin/bash
# ==============================================================
# CAM Agent Map Simulation - Multi-Agent Team Scenario
# ==============================================================
# Simulates a realistic multi-agent team working on a project.
# Sends events to localhost:7890 to trigger Agent Map visualization.
# ==============================================================

SERVER="http://localhost:7890/api/events"
SESSION="sim-demo-$(date +%s)"
DELAY=2  # seconds between events

echo "=== CAM Agent Map Simulation ==="
echo "Session: $SESSION"
echo "Server: $SERVER"
echo ""

send() {
  curl -s -X POST "$SERVER" \
    -H "Content-Type: application/json" \
    -d "$1" > /dev/null 2>&1
  echo "  -> sent: $2"
}

# ============================================================
# Phase 1: Team Leader starts and creates team
# ============================================================
echo "[Phase 1] Team leader initializes..."

send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "Read",
  "data": {
    "tool_name": "Read",
    "agent_name": "team-lead",
    "agent_type": "orchestrator",
    "tool_input": {"file_path": "/src/PRD.md"},
    "tool_output": "PRD loaded successfully"
  }
}' "team-lead reads PRD"
sleep $DELAY

send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "TaskCreate",
  "data": {
    "tool_name": "TaskCreate",
    "agent_name": "team-lead",
    "agent_type": "orchestrator",
    "tool_input": {"subject": "Implement auth module"},
    "tool_output": "Task created"
  }
}' "team-lead creates auth task"
sleep $DELAY

send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "TaskCreate",
  "data": {
    "tool_name": "TaskCreate",
    "agent_name": "team-lead",
    "agent_type": "orchestrator",
    "tool_input": {"subject": "Build dashboard UI"},
    "tool_output": "Task created"
  }
}' "team-lead creates dashboard task"
sleep $DELAY

# ============================================================
# Phase 2: Agents spawn and start working
# ============================================================
echo ""
echo "[Phase 2] Agents spawn and start working..."

# Backend engineer appears - reading code
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "Read",
  "data": {
    "tool_name": "Read",
    "agent_name": "backend-eng",
    "agent_type": "general-purpose",
    "tool_input": {"file_path": "/src/auth/handler.ts"},
    "tool_output": "File contents..."
  }
}' "backend-eng reads auth handler"
sleep 1

# Frontend engineer appears - searching code
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "frontend-eng",
  "tool": "Glob",
  "data": {
    "tool_name": "Glob",
    "agent_name": "frontend-eng",
    "agent_type": "general-purpose",
    "tool_input": {"pattern": "src/components/**/*.tsx"},
    "tool_output": "12 files found"
  }
}' "frontend-eng searches components"
sleep 1

# Researcher appears - web searching
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "researcher",
  "tool": "WebSearch",
  "data": {
    "tool_name": "WebSearch",
    "agent_name": "researcher",
    "agent_type": "Explore",
    "tool_input": {"query": "best practices JWT auth Node.js 2026"},
    "tool_output": "5 results found"
  }
}' "researcher searches JWT auth"
sleep 1

# Tester appears - running tests
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "tester",
  "tool": "Bash",
  "data": {
    "tool_name": "Bash",
    "agent_name": "tester",
    "agent_type": "general-purpose",
    "tool_input": {"command": "pnpm test --reporter verbose"},
    "tool_output": "42 tests passed, 0 failed"
  }
}' "tester runs test suite"
sleep $DELAY

# ============================================================
# Phase 3: Agents actively working (different poses)
# ============================================================
echo ""
echo "[Phase 3] Agents actively working..."

# Backend-eng editing auth code (CODING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "Edit",
  "data": {
    "tool_name": "Edit",
    "agent_name": "backend-eng",
    "tool_input": {"file_path": "/src/auth/jwt.ts", "old_string": "const secret", "new_string": "const JWT_SECRET"},
    "tool_output": "File edited"
  }
}' "backend-eng edits jwt.ts (coding pose)"
sleep 1

# Frontend-eng writing new component (CODING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "frontend-eng",
  "tool": "Write",
  "data": {
    "tool_name": "Write",
    "agent_name": "frontend-eng",
    "tool_input": {"file_path": "/src/components/LoginForm.tsx"},
    "tool_output": "File written"
  }
}' "frontend-eng writes LoginForm (coding pose)"
sleep 1

# Team lead messaging backend-eng (TALKING pose + interaction line)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "SendMessage",
  "data": {
    "tool_name": "SendMessage",
    "agent_name": "team-lead",
    "tool_input": {"recipient": "backend-eng", "content": "Use bcrypt for password hashing, not plain SHA256", "type": "message"}
  }
}' "team-lead messages backend-eng (talking pose)"
sleep $DELAY

# Researcher reading docs (READING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "researcher",
  "tool": "Read",
  "data": {
    "tool_name": "Read",
    "agent_name": "researcher",
    "tool_input": {"file_path": "/docs/security-guidelines.md"},
    "tool_output": "Security guidelines..."
  }
}' "researcher reads security docs (reading pose)"
sleep $DELAY

# ============================================================
# Phase 4: More activity + communication
# ============================================================
echo ""
echo "[Phase 4] Communication + continued work..."

# Backend-eng running bash (TERMINAL pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "Bash",
  "data": {
    "tool_name": "Bash",
    "tool_input": {"command": "npm install bcrypt jsonwebtoken"},
    "tool_output": "added 12 packages"
  }
}' "backend-eng installs packages (terminal pose)"
sleep 1

# Frontend-eng searching with grep (READING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "frontend-eng",
  "tool": "Grep",
  "data": {
    "tool_name": "Grep",
    "tool_input": {"pattern": "useAuth", "path": "src/"},
    "tool_output": "3 matches found"
  }
}' "frontend-eng greps useAuth (reading pose)"
sleep 1

# Tester editing test file (CODING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "tester",
  "tool": "Edit",
  "data": {
    "tool_name": "Edit",
    "tool_input": {"file_path": "/tests/auth.test.ts"},
    "tool_output": "File edited"
  }
}' "tester edits test file (coding pose)"
sleep 1

# Researcher messages team-lead with findings
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "researcher",
  "tool": "SendMessage",
  "data": {
    "tool_name": "SendMessage",
    "tool_input": {"recipient": "team-lead", "content": "Found OWASP cheat sheet for JWT - recommend RS256 over HS256", "type": "message"}
  }
}' "researcher messages team-lead (talking pose)"
sleep $DELAY

# Team-lead managing tasks (MANAGING pose)
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "TaskUpdate",
  "data": {
    "tool_name": "TaskUpdate",
    "tool_input": {"taskId": "1", "status": "in_progress", "owner": "backend-eng"}
  }
}' "team-lead assigns task to backend-eng (managing pose)"
sleep $DELAY

# ============================================================
# Phase 5: Backend-eng completes, tester finds error
# ============================================================
echo ""
echo "[Phase 5] Completion + error scenario..."

# Backend-eng finishes work
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "Edit",
  "data": {
    "tool_name": "Edit",
    "tool_input": {"file_path": "/src/auth/middleware.ts"},
    "tool_output": "File edited"
  }
}' "backend-eng final edit"
sleep 1

# Backend-eng messages team lead
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "SendMessage",
  "data": {
    "tool_name": "SendMessage",
    "tool_input": {"recipient": "team-lead", "content": "Auth module complete! JWT + bcrypt implemented", "type": "message"}
  }
}' "backend-eng reports completion"
sleep $DELAY

# Researcher completes and shuts down
send '{
  "hook": "SubagentStop",
  "session_id": "'"$SESSION"'",
  "agent_id": "researcher",
  "data": {
    "agent_name": "researcher",
    "reason": "shutdown_approved"
  }
}' "researcher shuts down (shutdown animation)"
sleep $DELAY

# Tester finds an error
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "tester",
  "tool": "Bash",
  "data": {
    "tool_name": "Bash",
    "tool_input": {"command": "pnpm test -- --grep auth"},
    "tool_output": "FAIL: auth token expiry test",
    "error_message": "Expected token to expire after 1h, got 24h"
  }
}' "tester finds bug! (error state)"
sleep 1

# Mark tester as having error
send '{
  "hook": "ToolError",
  "session_id": "'"$SESSION"'",
  "agent_id": "tester",
  "data": {
    "tool_name": "Bash",
    "error_message": "Test failed: auth token expiry assertion",
    "error_code": 1
  }
}' "tester error event (error indicator)"
sleep $DELAY

# ============================================================
# Phase 6: Continued work
# ============================================================
echo ""
echo "[Phase 6] Continued work after error..."

# Frontend-eng continues writing
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "frontend-eng",
  "tool": "Write",
  "data": {
    "tool_name": "Write",
    "tool_input": {"file_path": "/src/components/AuthProvider.tsx"},
    "tool_output": "File written"
  }
}' "frontend-eng writes AuthProvider"
sleep 1

# Backend-eng fixes the bug
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "tool": "Edit",
  "data": {
    "tool_name": "Edit",
    "tool_input": {"file_path": "/src/auth/jwt.ts"},
    "tool_output": "Fixed token expiry to 1h"
  }
}' "backend-eng fixes token expiry"
sleep 1

# Tester retests
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "tester",
  "tool": "Bash",
  "data": {
    "tool_name": "Bash",
    "tool_input": {"command": "pnpm test -- --grep auth"},
    "tool_output": "PASS: all auth tests passing (8/8)"
  }
}' "tester retests - all passing!"
sleep $DELAY

# Team lead marks task complete
send '{
  "hook": "PostToolUse",
  "session_id": "'"$SESSION"'",
  "agent_id": "team-lead",
  "tool": "TaskUpdate",
  "data": {
    "tool_name": "TaskUpdate",
    "tool_input": {"taskId": "1", "status": "completed"}
  }
}' "team-lead marks auth task complete"
sleep 1

# Backend-eng shuts down
send '{
  "hook": "SubagentStop",
  "session_id": "'"$SESSION"'",
  "agent_id": "backend-eng",
  "data": {
    "agent_name": "backend-eng",
    "reason": "shutdown_approved"
  }
}' "backend-eng shuts down"
sleep 1

echo ""
echo "=== Simulation complete! ==="
echo "Session ID: $SESSION"
echo "5 agents simulated: team-lead, backend-eng, frontend-eng, researcher, tester"
echo "Dashboard should show agents moving between poses and communicating!"
echo ""
echo "Active agents: team-lead, frontend-eng, tester"
echo "Shutdown agents: researcher, backend-eng"
