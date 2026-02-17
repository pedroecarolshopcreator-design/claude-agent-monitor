const path = require('path');
const db = require(path.join(__dirname, '..', 'packages', 'server', 'node_modules', 'better-sqlite3'))(
  path.join(__dirname, '..', 'packages', 'server', 'cam-data.db')
);

// Check file_changes
const fc = db.prepare("SELECT COUNT(*) as c FROM file_changes WHERE session_id='4bf964bc-08d2-435e-836a-dc9cf76fefc7'").get();
console.log('File changes for current session:', fc.c);
const total = db.prepare('SELECT COUNT(*) as c FROM file_changes').get();
console.log('Total file changes:', total.c);

// The remaining in_progress tasks
const tasks = db.prepare("SELECT id, title, prd_section, status FROM prd_tasks WHERE status='in_progress'").all();
console.log('\n=== Remaining in_progress tasks ===');
tasks.forEach(t => console.log(' [' + t.prd_section + ']', t.title));

// Reset ALL remaining false positives (Sprint 10, v1.1, Sprint 7 stretch)
const resetTargets = tasks.filter(t =>
  t.prd_section.includes('Sprint 10') ||
  t.prd_section.includes('v1.1') ||
  t.prd_section.includes('Sprint 7')
);

console.log('\n=== Resetting', resetTargets.length, 'tasks ===');
const stmt = db.prepare("UPDATE prd_tasks SET status=?, assigned_agent=NULL, updated_at=datetime('now') WHERE id=?");

for (const task of resetTargets) {
  const newStatus = task.prd_section.includes('v1.1') ? 'backlog' : 'planned';
  stmt.run(newStatus, task.id);
  console.log('  RESET:', task.title, '->', newStatus);
}

// Also delete associated agent_task_bindings
const deleteBindings = db.prepare('DELETE FROM agent_task_bindings WHERE prd_task_id=?');
for (const task of resetTargets) {
  deleteBindings.run(task.id);
}

// Recalc counters
const projId = 'b9f55006-36fe-4d98-a2ce-9f59064d7fee';
const projStats = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM prd_tasks WHERE project_id=?").get(projId);
db.prepare('UPDATE projects SET total_tasks=?, completed_tasks=? WHERE id=?').run(projStats.total, projStats.completed, projId);

const mvpId = 'f44082d6-5cb7-4bbc-b049-259dc9731842';
const mvpStats = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM prd_tasks WHERE sprint_id=?").get(mvpId);
db.prepare('UPDATE sprints SET total_tasks=?, completed_tasks=? WHERE id=?').run(mvpStats.total, mvpStats.completed, mvpId);

console.log('\nProject:', projStats.completed + '/' + projStats.total);
console.log('MVP Sprint:', mvpStats.completed + '/' + mvpStats.total);

// Final verification
const remaining = db.prepare("SELECT COUNT(*) as c FROM prd_tasks WHERE status='in_progress'").get();
console.log('\nRemaining in_progress:', remaining.c);

db.close();
console.log('Done!');
