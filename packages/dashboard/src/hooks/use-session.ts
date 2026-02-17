import { useEffect } from 'react';
import { useSessionStore } from '../stores/session-store';
import * as api from '../lib/api';

export function useSession() {
  const { session, setSession, setGroupId } = useSessionStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchActiveSession() {
      try {
        // 1. First, try to find an active session group (multi-agent team)
        const group = await api.fetchActiveSessionGroup();
        if (!cancelled && group) {
          setGroupId(group.id);

          // Use the main session from the group as the active session
          const { sessions: mainSessions } = await api.getSessions({ status: 'active', limit: 10 });
          const mainSession = mainSessions.find(
            (s: Record<string, unknown>) => s.id === group.mainSessionId
          );
          if (!cancelled && mainSession) {
            setSession(mainSession);
            return;
          }

          // Fallback: if main session not found in active, get it directly
          try {
            const { session: directSession } = await api.getSession(group.mainSessionId);
            if (!cancelled && directSession) {
              setSession(directSession);
              return;
            }
          } catch {
            // main session may not exist, fall through
          }
        }

        // 2. No group found, clear groupId and fall back to individual session
        if (!cancelled) {
          setGroupId(null);
        }

        // Try active sessions first
        const { sessions: activeSessions } = await api.getSessions({ status: 'active', limit: 1 });
        if (!cancelled && activeSessions.length > 0) {
          // Filter out simulation sessions - prefer real Claude Code sessions
          const realSession = activeSessions.find(
            (s: Record<string, unknown>) => !(s.id as string).startsWith('sim-demo-') && s.id !== 'test-stdin'
          ) ?? activeSessions[0];
          setSession(realSession);
          return;
        }

        // Fallback: get the most recent session of any status
        const { sessions: allSessions } = await api.getSessions({ limit: 1 });
        if (!cancelled && allSessions.length > 0) {
          const realSession = allSessions.find(
            (s: Record<string, unknown>) => !(s.id as string).startsWith('sim-demo-') && s.id !== 'test-stdin'
          ) ?? allSessions[0];
          setSession(realSession);
        }
      } catch {
        // Server may not be available yet
      }
    }

    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setSession, setGroupId]);

  return session;
}
