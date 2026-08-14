import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SessionContextValue {
  session: Session | null;
  userId: string | null;
  isSessionLoading: boolean;
  /** Incremented whenever a NEW sign-in happens (used by consumers that must re-check MFA). */
  authEventId: number;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * The ONLY `onAuthStateChange` subscription in the app.
 * Auth state is exposed as data (a query-key input), never as a fetch trigger.
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authEventId, setAuthEventId] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession ?? null);
      setIsSessionLoading(false);

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'MFA_CHALLENGE_VERIFIED') {
        setAuthEventId((n) => n + 1);
      }
    });

    // Initial read: resolves loading even if the SDK emits no event.
    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession((prev) => prev ?? data.session ?? null);
      setIsSessionLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      isSessionLoading,
      authEventId,
    }),
    [session, isSessionLoading, authEventId]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
