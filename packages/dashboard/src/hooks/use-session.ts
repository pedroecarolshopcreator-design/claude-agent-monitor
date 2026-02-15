import { useEffect } from 'react';
import { useSessionStore } from '../stores/session-store';
import * as api from '../lib/api';

export function useSession() {
  const { session, setSession } = useSessionStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchActiveSession() {
      try {
        const { sessions } = await api.getSessions({ status: 'active', limit: 1 });
        if (!cancelled && sessions.length > 0) {
          setSession(sessions[0]);
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
  }, [setSession]);

  return session;
}
