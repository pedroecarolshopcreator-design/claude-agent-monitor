/**
 * Fix script: Reset 10 falsely "in_progress" tasks back to "planned"
 *
 * These tasks were incorrectly set to in_progress by the correlation engine
 * assigning agents to tasks that were not actually being worked on.
 *
 * This script is idempotent - safe to run multiple times.
 *
 * Run from project root: node scripts/fix-task-status.cjs
 */

const Database = require(
  require('path').join(__dirname, '..', 'packages', 'server', 'node_modules', 'better-sqlite3')
);
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'packages', 'server', 'cam-data.db');
const altDbPath = path.join(process.cwd(), 'cam-data.db');
const finalDbPath = fs.existsSync(dbPath) ? dbPath : altDbPath;

if (!fs.existsSync(finalDbPath)) {
  console.error('ERROR: Database not found at', dbPath, 'or', altDbPath);
  process.exit(1);
}

console.log('Using DB:', finalDbPath);
const db = new Database(finalDbPath);

const PROJECT_ID = 'b9f55006-36fe-4d98-a2ce-9f59064d7fee';
const MVP_SPRINT_ID = 'f44082d6-5cb7-4bbc-b049-259dc9731842';

// Task titles that should NOT be in_progress
const TASKS_TO_RESET = [
  'Sugestoes automaticas de dependencias entre tasks',
  'Export de sessao/projeto',
  'Comparacao entre sessoes/sprints',
  'Dark/Light mode no tema Modern',
  'CLAUDE.md template with TaskTools instructions',
  'File-to-Task domain mapping automatico',
  'End-to-end correlation test suite',
  'Novos hook handlers: TaskCompleted, SubagentStart, PostToolUseFailure',
  'Atualizar PixelCharacter e AgentCard para Canvas renderer',
  'Styling de paineis redimensionaveis por tema',
];

// ============================================================
// Step 1: Show all currently in_progress tasks
// ============================================================
console.log('\n=== Step 1: Current in_progress tasks ===');

const inProgressTasks = db.prepare(
  "SELECT id, title, prd_section, assigned_agent, prd_line_start FROM prd_tasks WHERE status = 'in_progress'"
).all();

console.log(`Found ${inProgressTasks.length} tasks with status='in_progress':`);
inProgressTasks.forEach(t => {
  console.log(`  [${t.prd_section || 'no section'}] ${t.title} (agent: ${t.assigned_agent || 'none'})`);
});

// ============================================================
// Step 2: Reset matching tasks to "planned"
// ============================================================
console.log('\n=== Step 2: Resetting false in_progress tasks ===');

const updateStmt = db.prepare(
  "UPDATE prd_tasks SET status = 'planned', assigned_agent = NULL, started_at = NULL, updated_at = datetime('now') WHERE id = ?"
);

let resetCount = 0;

const resetTransaction = db.transaction(() => {
  for (const task of inProgressTasks) {
    // Match by exact title or partial match
    const shouldReset = TASKS_TO_RESET.some(targetTitle => {
      // Normalize both strings for comparison (remove accents, lowercase)
      const normalizedTask = task.title.toLowerCase().trim();
      const normalizedTarget = targetTitle.toLowerCase().trim();
      return normalizedTask === normalizedTarget ||
             normalizedTask.includes(normalizedTarget) ||
             normalizedTarget.includes(normalizedTask);
    });

    if (shouldReset) {
      console.log(`  RESETTING: "${task.title}" -> planned`);
      updateStmt.run(task.id);
      resetCount++;
    } else {
      console.log(`  KEEPING:   "${task.title}" (legitimate in_progress)`);
    }
  }
});

resetTransaction();

console.log(`\nReset ${resetCount} tasks from 'in_progress' to 'planned'.`);

// ============================================================
// Step 3: Clear agent_task_bindings for reset tasks
// ============================================================
console.log('\n=== Step 3: Clean up agent_task_bindings ===');

const resetTaskIds = inProgressTasks
  .filter(t => TASKS_TO_RESET.some(target => {
    const nt = t.title.toLowerCase().trim();
    const ng = target.toLowerCase().trim();
    return nt === ng || nt.includes(ng) || ng.includes(nt);
  }))
  .map(t => t.id);

if (resetTaskIds.length > 0) {
  const placeholders = resetTaskIds.map(() => '?').join(',');
  const bindingsDeleted = db.prepare(
    `DELETE FROM agent_task_bindings WHERE prd_task_id IN (${placeholders})`
  ).run(...resetTaskIds);
  console.log(`Deleted ${bindingsDeleted.changes} agent_task_bindings entries.`);
} else {
  console.log('No bindings to clean up.');
}

// ============================================================
// Step 4: Recalculate sprint and project task counters
// ============================================================
console.log('\n=== Step 4: Recalculate task counters ===');

// Count tasks by section (prd_line_start) for the MVP sprint
const totalTasks = db.prepare(
  "SELECT COUNT(*) as count FROM prd_tasks WHERE project_id = ?"
).get(PROJECT_ID);

const completedTasks = db.prepare(
  "SELECT COUNT(*) as count FROM prd_tasks WHERE project_id = ? AND status = 'completed'"
).get(PROJECT_ID);

const mvpTotal = db.prepare(
  "SELECT COUNT(*) as count FROM prd_tasks WHERE project_id = ? AND sprint_id = ?"
).get(PROJECT_ID, MVP_SPRINT_ID);

const mvpCompleted = db.prepare(
  "SELECT COUNT(*) as count FROM prd_tasks WHERE project_id = ? AND sprint_id = ? AND status = 'completed'"
).get(PROJECT_ID, MVP_SPRINT_ID);

// Update project counters
db.prepare(
  "UPDATE projects SET total_tasks = ?, completed_tasks = ?, updated_at = datetime('now') WHERE id = ?"
).run(totalTasks.count, completedTasks.count, PROJECT_ID);

console.log(`Project: ${completedTasks.count}/${totalTasks.count} completed`);

// Update MVP sprint counters
db.prepare(
  "UPDATE sprints SET total_tasks = ?, completed_tasks = ? WHERE id = ?"
).run(mvpTotal.count, mvpCompleted.count, MVP_SPRINT_ID);

console.log(`MVP Sprint: ${mvpCompleted.count}/${mvpTotal.count} completed`);

// ============================================================
// Step 5: Verification
// ============================================================
console.log('\n=== Step 5: Verification ===');

const remainingInProgress = db.prepare(
  "SELECT id, title, prd_section FROM prd_tasks WHERE status = 'in_progress'"
).all();

console.log(`Remaining in_progress tasks: ${remainingInProgress.length}`);
remainingInProgress.forEach(t => {
  console.log(`  [${t.prd_section || 'no section'}] ${t.title}`);
});

const statusSummary = db.prepare(
  "SELECT status, COUNT(*) as count FROM prd_tasks WHERE project_id = ? GROUP BY status ORDER BY count DESC"
).all(PROJECT_ID);

console.log('\nTask status summary:');
statusSummary.forEach(s => {
  console.log(`  ${s.status}: ${s.count}`);
});

db.close();
console.log('\nDone!');
