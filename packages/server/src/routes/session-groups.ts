import { Router } from 'express';
import type { Request, Response } from 'express';
import { sessionGroupQueries, sessionGroupMemberQueries, agentQueries } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { DEFAULT_EVENT_LIMIT } from '@cam/shared';

export const sessionGroupsRouter = Router();

interface GroupRow {
  id: string;
  name: string | null;
  main_session_id: string;
  created_at: string;
}

interface MemberRow {
  group_id: string;
  session_id: string;
  agent_name: string | null;
  agent_type: string | null;
  joined_at: string;
  session_status: string;
  started_at: string;
  ended_at: string | null;
  agent_count: number;
  event_count: number;
  working_directory: string;
}

function mapGroup(row: GroupRow) {
  return {
    id: row.id,
    name: row.name ?? undefined,
    mainSessionId: row.main_session_id,
    createdAt: row.created_at,
  };
}

function mapMember(row: MemberRow) {
  return {
    groupId: row.group_id,
    sessionId: row.session_id,
    agentName: row.agent_name ?? undefined,
    agentType: row.agent_type ?? undefined,
    joinedAt: row.joined_at,
    sessionStatus: row.session_status,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    agentCount: row.agent_count,
    eventCount: row.event_count,
    workingDirectory: row.working_directory,
  };
}

// GET /api/session-groups - List all groups
sessionGroupsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rows = sessionGroupQueries.getAll().all() as GroupRow[];
    const groups = rows.map(row => {
      const members = sessionGroupMemberQueries.getByGroup().all(row.id) as MemberRow[];
      return {
        ...mapGroup(row),
        memberCount: members.length,
        members: members.map(mapMember),
      };
    });
    res.json({ groups });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session-groups/active - Get currently active group
sessionGroupsRouter.get('/active', (_req: Request, res: Response) => {
  try {
    const row = sessionGroupQueries.getActiveGroup().get() as GroupRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'No active session group found' });
      return;
    }

    const members = sessionGroupMemberQueries.getByGroup().all(row.id) as MemberRow[];
    const group = {
      ...mapGroup(row),
      memberCount: members.length,
      members: members.map(mapMember),
    };

    res.json({ group });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session-groups/:id - Group details with members
sessionGroupsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const groupId = req.params['id']!;
    const row = sessionGroupQueries.getById().get(groupId) as GroupRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Session group not found' });
      return;
    }

    const members = sessionGroupMemberQueries.getByGroup().all(groupId) as MemberRow[];
    const group = {
      ...mapGroup(row),
      memberCount: members.length,
      members: members.map(mapMember),
    };

    res.json({ group });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session-groups/:id/events - Events from ALL members (merged timeline)
sessionGroupsRouter.get('/:id/events', (req: Request, res: Response) => {
  try {
    const groupId = req.params['id']!;
    const limit = parseInt(req.query['limit'] as string) || DEFAULT_EVENT_LIMIT;
    const offset = parseInt(req.query['offset'] as string) || 0;
    const category = req.query['category'] as string | undefined;

    // Get all session IDs in the group
    const memberRows = sessionGroupMemberQueries.getAllSessionIdsInGroup().all(groupId) as Array<Record<string, unknown>>;
    if (memberRows.length === 0) {
      res.status(404).json({ error: 'Session group not found or has no members' });
      return;
    }

    const sessionIds = memberRows.map(m => m['session_id'] as string);

    // Query events from all sessions, merged by timestamp
    // We build the query dynamically since we need IN (?, ?, ...)
    const db = getDb();

    const placeholders = sessionIds.map(() => '?').join(', ');
    let query: string;
    let params: unknown[];

    if (category) {
      query = `
        SELECT * FROM events
        WHERE session_id IN (${placeholders}) AND category = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;
      params = [...sessionIds, category, limit, offset];
    } else {
      query = `
        SELECT * FROM events
        WHERE session_id IN (${placeholders})
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;
      params = [...sessionIds, limit, offset];
    }

    const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

    const events = rows.map(row => ({
      id: row['id'],
      sessionId: row['session_id'],
      agentId: row['agent_id'],
      timestamp: row['timestamp'],
      hookType: row['hook_type'],
      category: row['category'],
      tool: row['tool'] ?? undefined,
      filePath: row['file_path'] ?? undefined,
      input: row['input'] ?? undefined,
      output: row['output'] ?? undefined,
      error: row['error'] ?? undefined,
      duration: row['duration'] ?? undefined,
      metadata: row['metadata'] ? JSON.parse(row['metadata'] as string) : undefined,
    }));

    res.json({ events, sessionIds });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session-groups/:id/agents - All agents across all sessions in group
sessionGroupsRouter.get('/:id/agents', (req: Request, res: Response) => {
  try {
    const groupId = req.params['id']!;

    const memberRows = sessionGroupMemberQueries.getAllSessionIdsInGroup().all(groupId) as Array<Record<string, unknown>>;
    if (memberRows.length === 0) {
      res.status(404).json({ error: 'Session group not found or has no members' });
      return;
    }

    const agents: Array<Record<string, unknown>> = [];
    for (const member of memberRows) {
      const sessionId = member['session_id'] as string;
      const sessionAgents = agentQueries.getBySession().all(sessionId) as Array<Record<string, unknown>>;
      for (const agent of sessionAgents) {
        agents.push({
          id: agent['id'],
          sessionId: agent['session_id'],
          name: agent['name'],
          type: agent['type'],
          status: agent['status'],
          firstSeenAt: agent['first_seen_at'],
          lastActivityAt: agent['last_activity_at'],
          currentTask: agent['current_task'] ?? undefined,
          toolCallCount: agent['tool_call_count'],
          errorCount: agent['error_count'],
        });
      }
    }

    res.json({ agents });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});
