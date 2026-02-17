#!/usr/bin/env node

/**
 * CAM End-to-End Pipeline Test
 *
 * Tests the full lifecycle:
 *   SessionStart -> Agent appears -> Task planned->in_progress->completed -> Stop -> SessionEnd
 *
 * REQUIREMENTS:
 *   - CAM server must be running on port 7890 (pnpm dev)
 *   - Open the dashboard at http://localhost:7891 to watch in real-time
 *
 * USAGE:
 *   node scripts/test-full-pipeline.cjs
 *
 * The script will:
 *   1. Create a temporary test PRD task (status=planned)
 *   2. Send hook events simulating a full agent session
 *   3. Verify state at each step
 *   4. Clean up the test data
 */

const http = require("http");
const crypto = require("crypto");
const path = require("path");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SERVER_HOST = "localhost";
const SERVER_PORT = 7890;
const BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Test identifiers (unique per run)
const TEST_RUN_ID = crypto.randomUUID().slice(0, 8);
const TEST_SESSION_ID = `test-session-${TEST_RUN_ID}`;
const TEST_AGENT_ID = TEST_SESSION_ID; // agent_id = session_id (Claude Code pattern)
const TEST_TASK_ID = crypto.randomUUID();
const TEST_TASK_TITLE = `Test Pipeline E2E Validation ${TEST_RUN_ID}`;
const TEST_WORKING_DIR = process.cwd().replace(/\\/g, "/");

// Known project ID (CAM project)
const PROJECT_ID = "b9f55006-36fe-4d98-a2ce-9f59064d7fee";
const SPRINT_ID = "f44082d6-5cb7-4bbc-b049-259dc9731842";

// Delays between steps (ms) - allows dashboard to update visually
const STEP_DELAY = 1500;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function httpRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: urlPath,
      method,
      headers: { "Content-Type": "application/json" },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function postEvent(payload) {
  return httpRequest("POST", "/api/events", payload);
}

async function getSession(sessionId) {
  return httpRequest("GET", `/api/sessions/${sessionId}`);
}

async function getAgents(sessionId) {
  return httpRequest("GET", `/api/sessions/${sessionId}/agents`);
}

async function getPrdTask(taskId) {
  return httpRequest("GET", `/api/projects/${PROJECT_ID}/tasks/${taskId}`);
}

async function getPrdTasks() {
  return httpRequest("GET", `/api/projects/${PROJECT_ID}/tasks?status=all`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// DB setup/teardown (direct SQLite access)
// ---------------------------------------------------------------------------

let db;

function setupDb() {
  const Database = require(
    path.join(__dirname, "..", "node_modules", ".pnpm", "better-sqlite3@11.6.0", "node_modules", "better-sqlite3"),
  );
  const dbPath = path.join(__dirname, "..", "packages", "server", "cam-data.db");
  db = new Database(dbPath);
}

function createTestTask() {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO prd_tasks (id, project_id, sprint_id, title, description, status, priority, tags, depends_on, blocked_by, prd_section, prd_line_start, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'planned', 'high', '["test","pipeline","validation","e2e"]', '[]', '[]', 'Test - Pipeline Validation', 7, ?, ?)`,
  ).run(
    TEST_TASK_ID,
    PROJECT_ID,
    SPRINT_ID,
    TEST_TASK_TITLE,
    "Temporary task for end-to-end pipeline validation. Should be auto-deleted after test.",
    now,
    now,
  );
  console.log(`   Created test PRD task: "${TEST_TASK_TITLE}" (${TEST_TASK_ID})`);
}

function getTaskStatus() {
  const row = db
    .prepare("SELECT status, assigned_agent FROM prd_tasks WHERE id = ?")
    .get(TEST_TASK_ID);
  return row || { status: "NOT_FOUND", assigned_agent: null };
}

function getAgentStatus() {
  const row = db
    .prepare(
      "SELECT status, tool_call_count, error_count FROM agents WHERE id = ? AND session_id = ?",
    )
    .get(TEST_AGENT_ID, TEST_SESSION_ID);
  return row || { status: "NOT_FOUND", tool_call_count: 0, error_count: 0 };
}

function getSessionStatus() {
  const row = db
    .prepare("SELECT status, event_count, agent_count FROM sessions WHERE id = ?")
    .get(TEST_SESSION_ID);
  return row || { status: "NOT_FOUND", event_count: 0, agent_count: 0 };
}

function getBindings() {
  const rows = db
    .prepare(
      "SELECT prd_task_id, confidence, expired_at FROM agent_task_bindings WHERE agent_id = ? AND session_id = ?",
    )
    .all(TEST_AGENT_ID, TEST_SESSION_ID);
  return rows;
}

function getCorrelationAudit() {
  const rows = db
    .prepare(
      "SELECT layer, score, matched, reason FROM correlation_audit_log WHERE session_id = ? ORDER BY timestamp DESC LIMIT 10",
    )
    .all(TEST_SESSION_ID);
  return rows;
}

function cleanup() {
  console.log("\n--- Limpeza ---");
  db.prepare("DELETE FROM correlation_audit_log WHERE session_id = ?").run(
    TEST_SESSION_ID,
  );
  db.prepare("DELETE FROM agent_task_bindings WHERE session_id = ?").run(
    TEST_SESSION_ID,
  );
  db.prepare("DELETE FROM task_activities WHERE session_id = ?").run(
    TEST_SESSION_ID,
  );
  db.prepare("DELETE FROM events WHERE session_id = ?").run(TEST_SESSION_ID);
  db.prepare("DELETE FROM agents WHERE session_id = ?").run(TEST_SESSION_ID);
  db.prepare("DELETE FROM sessions WHERE id = ?").run(TEST_SESSION_ID);
  db.prepare("DELETE FROM session_project_bindings WHERE session_id = ?").run(
    TEST_SESSION_ID,
  );
  db.prepare("DELETE FROM prd_tasks WHERE id = ?").run(TEST_TASK_ID);
  db.prepare("DELETE FROM task_items WHERE session_id = ?").run(
    TEST_SESSION_ID,
  );
  console.log("   Todos os dados de teste removidos.");
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const INFO = "\x1b[36mINFO\x1b[0m";
const WARN = "\x1b[33mWARN\x1b[0m";

let passCount = 0;
let failCount = 0;

function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`   [${PASS}] ${label}: ${actual}`);
    passCount++;
  } else {
    console.log(`   [${FAIL}] ${label}: got "${actual}", expected "${expected}"`);
    failCount++;
  }
}

function info(label, value) {
  console.log(`   [${INFO}] ${label}: ${value}`);
}

// ---------------------------------------------------------------------------
// Pipeline Steps
// ---------------------------------------------------------------------------

async function step1_SessionStart() {
  console.log("\n=== STEP 1: SessionStart ===");
  console.log("   Simulando: agente inicia uma sessao de trabalho");

  const res = await postEvent({
    hook: "SessionStart",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      working_directory: TEST_WORKING_DIR,
    },
  });

  check("HTTP response", res.status, 200);

  const session = getSessionStatus();
  check("Session status", session.status, "active");
  check("Session agent_count", session.agent_count, 1);

  // Check session-project binding
  const binding = db
    .prepare(
      "SELECT project_id FROM session_project_bindings WHERE session_id = ?",
    )
    .get(TEST_SESSION_ID);
  if (binding) {
    check("Session-Project binding", binding.project_id, PROJECT_ID);
  } else {
    console.log(`   [${WARN}] Session-Project binding nao criado (pode ser normal se prd_source nao corresponde ao working_directory)`);
  }

  const task = getTaskStatus();
  check("PRD task status (unchanged)", task.status, "planned");
}

async function step2_AgentReadsFiles() {
  console.log("\n=== STEP 2: Agent le arquivos (pesquisa) ===");
  console.log('   Simulando: agente usa Read em "pipeline-validation.ts"');

  const res = await postEvent({
    hook: "PostToolUse",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      tool_name: "Read",
      file_path: "packages/server/src/services/pipeline-validation.ts",
      tool_input: JSON.stringify({
        file_path: "packages/server/src/services/pipeline-validation.ts",
      }),
      tool_output: JSON.stringify({ content: "// pipeline validation code..." }),
    },
  });

  check("HTTP response", res.status, 200);

  const agent = getAgentStatus();
  check("Agent status", agent.status, "active");
  check("Agent tool_call_count", agent.tool_call_count, 1);

  // Check if correlation engine matched the task
  const task = getTaskStatus();
  info("PRD task status after Read", task.status);
  info("PRD task assigned_agent", task.assigned_agent || "none");

  const audit = getCorrelationAudit();
  if (audit.length > 0) {
    info("Correlation audit entries", audit.length);
    for (const a of audit.slice(0, 3)) {
      info(
        `  Layer ${a.layer}`,
        `score=${a.score.toFixed(2)}, matched=${a.matched}, ${a.reason.slice(0, 100)}`,
      );
    }
  }
}

async function step3_AgentEditsFile() {
  console.log("\n=== STEP 3: Agent edita arquivo (implementacao) ===");
  console.log('   Simulando: agente usa Edit em "pipeline-validation.ts"');
  console.log("   Expectativa: correlation engine move task para in_progress");

  const res = await postEvent({
    hook: "PostToolUse",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      tool_name: "Edit",
      file_path: "packages/server/src/services/pipeline-validation.ts",
      tool_input: JSON.stringify({
        file_path: "packages/server/src/services/pipeline-validation.ts",
        old_string: "// placeholder",
        new_string: "// pipeline validation implementation",
      }),
      tool_output: JSON.stringify({ success: true }),
    },
  });

  check("HTTP response", res.status, 200);

  const agent = getAgentStatus();
  check("Agent tool_call_count", agent.tool_call_count, 2);

  const task = getTaskStatus();
  info("PRD task status after Edit", task.status);
  info("PRD task assigned_agent", task.assigned_agent || "none");

  // Check if binding was created
  const bindings = getBindings();
  info("Agent-Task bindings", bindings.length);
  for (const b of bindings) {
    info(
      `  Binding`,
      `task=${b.prd_task_id.slice(0, 8)}, confidence=${b.confidence.toFixed(2)}, expired=${b.expired_at || "no"}`,
    );
  }
}

async function step4_AgentRunsTest() {
  console.log("\n=== STEP 4: Agent roda teste (Bash) ===");
  console.log("   Simulando: agente executa teste com sucesso");

  const res = await postEvent({
    hook: "PostToolUse",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      tool_name: "Bash",
      tool_input: JSON.stringify({
        command: "pnpm test -- --grep pipeline-validation",
      }),
      tool_output: JSON.stringify({
        output: "PASS  pipeline-validation.test.ts\n  1 test passed\n  Tests:  1 passed, 1 total",
        exit_code: 0,
      }),
    },
  });

  check("HTTP response", res.status, 200);

  const agent = getAgentStatus();
  check("Agent tool_call_count", agent.tool_call_count, 3);

  const task = getTaskStatus();
  info("PRD task status after test pass", task.status);
}

async function step5_TaskUpdateCompleted() {
  console.log("\n=== STEP 5: TaskUpdate(status=completed) - GOLD Path ===");
  console.log("   Simulando: agente marca tarefa como concluida via TaskUpdate");
  console.log("   Expectativa: GOLD path auto-completa PRD task");

  const res = await postEvent({
    hook: "PostToolUse",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      tool_name: "TaskUpdate",
      tool_input: JSON.stringify({
        taskId: `internal-task-${TEST_RUN_ID}`,
        status: "completed",
        subject: TEST_TASK_TITLE,
      }),
      tool_output: JSON.stringify({ success: true }),
    },
  });

  check("HTTP response", res.status, 200);

  const task = getTaskStatus();
  check("PRD task status (GOLD path)", task.status, "completed");

  const bindings = getBindings();
  const goldBinding = bindings.find((b) => b.confidence >= 0.95);
  if (goldBinding) {
    check(
      "GOLD binding confidence",
      goldBinding.confidence >= 0.95 ? ">=0.95" : `${goldBinding.confidence}`,
      ">=0.95",
    );
  } else {
    info("Bindings found", bindings.length);
    for (const b of bindings) {
      info(
        `  Binding`,
        `confidence=${b.confidence.toFixed(2)}, task=${b.prd_task_id.slice(0, 8)}`,
      );
    }
  }
}

async function step6_PostToolUseFailure() {
  console.log("\n=== STEP 6: PostToolUseFailure (novo handler) ===");
  console.log("   Simulando: uma ferramenta falha");

  const res = await postEvent({
    hook: "PostToolUseFailure",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      tool_name: "Write",
      error: "Permission denied: /etc/readonly-file.ts",
      file_path: "/etc/readonly-file.ts",
    },
  });

  check("HTTP response", res.status, 200);

  const agent = getAgentStatus();
  check("Agent error_count", agent.error_count, 1);

  // Verify event was persisted with error category
  const errorEvent = db
    .prepare(
      "SELECT category, error FROM events WHERE session_id = ? AND hook_type = 'PostToolUseFailure' LIMIT 1",
    )
    .get(TEST_SESSION_ID);
  if (errorEvent) {
    check("Event category", errorEvent.category, "error");
    info("Error message", errorEvent.error || "none");
  }
}

async function step7_Stop() {
  console.log("\n=== STEP 7: Stop (agente finaliza) ===");
  console.log("   Simulando: agente termina o trabalho");

  const res = await postEvent({
    hook: "Stop",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      reason: "natural",
      stop_type: "natural",
    },
  });

  check("HTTP response", res.status, 200);

  const agent = getAgentStatus();
  check("Agent status", agent.status, "completed");
}

async function step8_SessionEnd() {
  console.log("\n=== STEP 8: SessionEnd (sessao encerra) ===");
  console.log("   Simulando: sessao e finalizada");

  const res = await postEvent({
    hook: "SessionEnd",
    timestamp: new Date().toISOString(),
    session_id: TEST_SESSION_ID,
    agent_id: TEST_AGENT_ID,
    data: {
      working_directory: TEST_WORKING_DIR,
    },
  });

  check("HTTP response", res.status, 200);

  const session = getSessionStatus();
  info("Session status", session.status);
  info("Session event_count", session.event_count);
  info("Session agent_count", session.agent_count);
}

async function step9_FinalVerification() {
  console.log("\n=== STEP 9: Verificacao Final ===");

  const task = getTaskStatus();
  check("PRD task final status", task.status, "completed");

  const agent = getAgentStatus();
  check("Agent final status", agent.status, "completed");
  info("Agent tool_call_count", agent.tool_call_count);
  info("Agent error_count", agent.error_count);

  const session = getSessionStatus();
  info("Session final status", session.status);
  info("Session total events", session.event_count);

  // Count correlation audit entries
  const auditCount = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM correlation_audit_log WHERE session_id = ?",
    )
    .get(TEST_SESSION_ID);
  info("Correlation audit entries", auditCount.cnt);

  // Count bindings
  const bindingCount = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM agent_task_bindings WHERE session_id = ?",
    )
    .get(TEST_SESSION_ID);
  info("Agent-Task bindings created", bindingCount.cnt);

  // Count task activities
  const activityCount = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM task_activities WHERE session_id = ?",
    )
    .get(TEST_SESSION_ID);
  info("Task activities recorded", activityCount.cnt);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("====================================================");
  console.log("  CAM End-to-End Pipeline Test");
  console.log("====================================================");
  console.log(`  Run ID:      ${TEST_RUN_ID}`);
  console.log(`  Session:     ${TEST_SESSION_ID}`);
  console.log(`  Test Task:   ${TEST_TASK_TITLE}`);
  console.log(`  Working Dir: ${TEST_WORKING_DIR}`);
  console.log(`  Server:      ${BASE_URL}`);
  console.log("====================================================");

  // Check server is running
  try {
    await httpRequest("GET", "/api/health");
  } catch (e) {
    // Try sessions endpoint as health check
    try {
      await httpRequest("GET", "/api/sessions");
    } catch {
      console.error(
        `\n[ERRO] Servidor CAM nao esta rodando em ${BASE_URL}`,
      );
      console.error("  Execute: pnpm dev");
      process.exit(1);
    }
  }
  console.log(`\n[${INFO}] Servidor CAM conectado.`);

  // Setup
  setupDb();
  createTestTask();

  try {
    // Run pipeline steps
    await step1_SessionStart();
    await sleep(STEP_DELAY);

    await step2_AgentReadsFiles();
    await sleep(STEP_DELAY);

    await step3_AgentEditsFile();
    await sleep(STEP_DELAY);

    await step4_AgentRunsTest();
    await sleep(STEP_DELAY);

    await step5_TaskUpdateCompleted();
    await sleep(STEP_DELAY);

    await step6_PostToolUseFailure();
    await sleep(STEP_DELAY);

    await step7_Stop();
    await sleep(STEP_DELAY);

    await step8_SessionEnd();
    await sleep(STEP_DELAY);

    await step9_FinalVerification();
  } finally {
    // Cleanup
    cleanup();
    db.close();
  }

  // Summary
  console.log("\n====================================================");
  console.log("  RESULTADO");
  console.log("====================================================");
  console.log(`  ${PASS}: ${passCount}`);
  console.log(`  ${FAIL}: ${failCount}`);
  console.log(
    `  Total: ${passCount + failCount} checks`,
  );
  console.log("====================================================");

  if (failCount > 0) {
    console.log(
      `\n  ${FAIL} ${failCount} verificacao(oes) falharam. Verifique os detalhes acima.`,
    );
    process.exit(1);
  } else {
    console.log(`\n  ${PASS} Pipeline completo funcionando!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  if (db) {
    try { cleanup(); } catch { /* ignore */ }
    db.close();
  }
  process.exit(1);
});
