/**
 * Backfill file_changes table from existing events.
 *
 * Problem: extractFilePath() had a bug where stringified tool_input
 * prevented file_path extraction. This script retroactively:
 * 1. Finds events with category='file_change' (or file read tools) that have NULL file_path
 * 2. Parses the input/metadata to extract the file_path
 * 3. Updates the events table with the extracted file_path
 * 4. Upserts into file_changes table
 */

const path = require('path');
const Database = require(path.join(__dirname, '..', 'packages', 'server', 'node_modules', 'better-sqlite3'));

const dbPath = path.join(__dirname, '..', 'packages', 'server', 'cam-data.db');

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error('Could not open database at', dbPath);
  console.error(err.message);
  process.exit(1);
}

db.pragma('journal_mode = WAL');

const FILE_CHANGE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const FILE_READ_TOOLS = ['Read', 'Glob', 'Grep'];

/**
 * Try to extract a file path from a JSON string or object.
 * Returns the path string or undefined.
 */
function tryExtractFilePath(raw) {
  if (!raw) return undefined;

  let obj;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return undefined;
    }
  } else if (typeof raw === 'object') {
    obj = raw;
  } else {
    return undefined;
  }

  if (typeof obj !== 'object' || obj === null) return undefined;

  // Check top-level
  if (typeof obj.file_path === 'string') return obj.file_path;
  if (typeof obj.path === 'string') return obj.path;
  if (typeof obj.filePath === 'string') return obj.filePath;

  // Check inside tool_input
  let toolInput = obj.tool_input;
  if (typeof toolInput === 'string') {
    try {
      toolInput = JSON.parse(toolInput);
    } catch {
      return undefined;
    }
  }
  if (typeof toolInput === 'object' && toolInput !== null) {
    if (typeof toolInput.file_path === 'string') return toolInput.file_path;
    if (typeof toolInput.path === 'string') return toolInput.path;
    if (typeof toolInput.filePath === 'string') return toolInput.filePath;
  }

  return undefined;
}

// Step 1: Find all events that could have a file_path but don't
const allTools = [...FILE_CHANGE_TOOLS, ...FILE_READ_TOOLS];
const placeholders = allTools.map(() => '?').join(', ');

const eventsToFix = db.prepare(`
  SELECT id, session_id, agent_id, tool, category, input, metadata, timestamp
  FROM events
  WHERE file_path IS NULL
    AND tool IN (${placeholders})
`).all(...allTools);

console.log(`Found ${eventsToFix.length} events with NULL file_path and relevant tools`);

const updateEventFilePath = db.prepare(`
  UPDATE events SET file_path = ? WHERE id = ?
`);

const upsertFileChange = db.prepare(`
  INSERT INTO file_changes (file_path, session_id, agent_id, change_type, first_touched_at, last_touched_at, touch_count)
  VALUES (?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(file_path, session_id, agent_id) DO UPDATE SET
    change_type = CASE
      WHEN excluded.change_type IN ('created', 'modified') THEN excluded.change_type
      ELSE file_changes.change_type
    END,
    last_touched_at = excluded.last_touched_at,
    touch_count = file_changes.touch_count + 1
`);

let fixedCount = 0;
let fileChangeCount = 0;

const backfill = db.transaction(() => {
  for (const event of eventsToFix) {
    // Try to extract file_path from input field first, then metadata
    let filePath = tryExtractFilePath(event.input);
    if (!filePath) {
      filePath = tryExtractFilePath(event.metadata);
    }

    if (!filePath) continue;

    // Update event with extracted file_path
    updateEventFilePath.run(filePath, event.id);
    fixedCount++;

    // Determine change type
    let changeType;
    if (FILE_READ_TOOLS.includes(event.tool)) {
      changeType = 'read';
    } else if (event.tool === 'Write') {
      changeType = 'created';
    } else {
      changeType = 'modified';
    }

    // Upsert into file_changes
    upsertFileChange.run(
      filePath,
      event.session_id,
      event.agent_id,
      changeType,
      event.timestamp,
      event.timestamp
    );
    fileChangeCount++;
  }
});

backfill();

console.log(`Updated ${fixedCount} events with extracted file_path`);
console.log(`Upserted ${fileChangeCount} file_changes records`);

// Also process events that already have file_path but might be missing from file_changes table
const eventsWithPath = db.prepare(`
  SELECT e.id, e.session_id, e.agent_id, e.tool, e.category, e.file_path, e.timestamp
  FROM events e
  WHERE e.file_path IS NOT NULL
    AND e.tool IN (${placeholders})
    AND NOT EXISTS (
      SELECT 1 FROM file_changes fc
      WHERE fc.file_path = e.file_path
        AND fc.session_id = e.session_id
        AND fc.agent_id = e.agent_id
    )
`).all(...allTools);

console.log(`Found ${eventsWithPath.length} events with file_path but missing from file_changes`);

let missingCount = 0;

const backfillMissing = db.transaction(() => {
  for (const event of eventsWithPath) {
    let changeType;
    if (FILE_READ_TOOLS.includes(event.tool)) {
      changeType = 'read';
    } else if (event.tool === 'Write') {
      changeType = 'created';
    } else {
      changeType = 'modified';
    }

    upsertFileChange.run(
      event.file_path,
      event.session_id,
      event.agent_id,
      changeType,
      event.timestamp,
      event.timestamp
    );
    missingCount++;
  }
});

backfillMissing();

console.log(`Backfilled ${missingCount} missing file_changes from events with existing file_path`);

// Summary
const totalFileChanges = db.prepare('SELECT COUNT(*) as cnt FROM file_changes').get();
const totalEvents = db.prepare('SELECT COUNT(*) as cnt FROM events').get();
const eventsWithFilePath = db.prepare('SELECT COUNT(*) as cnt FROM events WHERE file_path IS NOT NULL').get();

console.log('\n--- Summary ---');
console.log(`Total events: ${totalEvents.cnt}`);
console.log(`Events with file_path: ${eventsWithFilePath.cnt}`);
console.log(`Total file_changes records: ${totalFileChanges.cnt}`);

db.close();
console.log('\nDone!');
