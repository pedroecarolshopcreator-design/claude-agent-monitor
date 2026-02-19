import { useCallback, useEffect, useRef } from "react";
import * as api from "../lib/api.js";
import { useSessionStore } from "../stores/session-store.js";

/**
 * Check if URL has a session_id parameter, meaning the session URL hook
 * will handle session selection.
 */
function hasSessionIdInUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('session_id');
}

export function useSession() {
  const { session, setSession, setProjectId } = useSessionStore();
  // Track whether user has manually selected a session (or initial load happened)
  const hasInitialized = useRef(false);

  const loadSession = useCallback(async () => {
    // If a session is already selected (initial load done or user picked one), don't override
    if (hasInitialized.current) return;

    // If URL has session_id, let use-session-url handle session selection
    if (hasSessionIdInUrl()) {
      hasInitialized.current = true;
      return;
    }

    try {
      // 1. Try to find a registered project with active sessions
      try {
        const { registrations } = await api.getRegisteredProjects();
        if (registrations.length > 0) {
          const activeReg = registrations.find(r => r.project_status === "active") || registrations[0];
          setProjectId(activeReg.project_id);

          // Get sessions ONLY for this project (filtered by project_id)
          const { sessions } = await api.getProjectSessions(activeReg.project_id);
          const activeSession = sessions.find((s: Record<string, unknown>) => s.status === "active");
          if (activeSession) {
            const { session: fullSession } = await api.getSession(activeSession.id as string);
            setSession(fullSession);
            hasInitialized.current = true;
            return;
          }
        }

        // No registered projects or no active sessions for this project.
        // Show the onboarding screen instead of sessions from other projects.
        hasInitialized.current = true;
        return;
      } catch {
        // Registry API not available — fall back to latest active session
        // (legacy behavior for servers without project registry support)
      }

      // 2. Fall back only when registry API is unavailable
      setProjectId(null);
      const { sessions } = await api.getSessions({ status: "active", limit: 1 });
      if (sessions.length > 0) {
        const { session: latestSession } = await api.getSession(sessions[0].id);
        setSession(latestSession);
        hasInitialized.current = true;
      }
    } catch {
      // API not available - retry on next interval
    }
  }, [setSession, setProjectId]);

  useEffect(() => {
    loadSession();
    // Keep polling only until initial session is found, then stop
    const interval = setInterval(loadSession, 15_000);
    return () => clearInterval(interval);
  }, [loadSession]);

  return { session, refreshSession: loadSession };
}
