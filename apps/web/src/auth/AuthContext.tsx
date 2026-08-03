import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken, setUnauthorizedHandler, ApiError } from '../api/client';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string | null;
  role: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * On mount, attempts a silent refresh (the httpOnly refresh cookie may
 * already be valid from a previous session) before falling back to the
 * login page — avoids forcing a re-login on every page reload.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      try {
        const refreshed = await api.post<{ accessToken: string }>('/auth/refresh');
        setAccessToken(refreshed.accessToken);
        const me = await api.get<CurrentUser>('/auth/me');
        setUser(me);
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        const result = await api.post<{ accessToken: string; user: CurrentUser }>('/auth/login', { email, password });
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          // best-effort: clear local state regardless
        }
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
