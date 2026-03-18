import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

function getApiBase(): string {
  const base = (import.meta as any).env?.BASE_URL ?? "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/user`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${getApiBase()}/api/login?returnTo=${returnTo}`;
  }, []);

  const loginWithGoogle = useCallback(() => {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${getApiBase()}/api/auth/google/login?returnTo=${returnTo}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = `${getApiBase()}/api/logout`;
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    loginWithGoogle,
    logout,
  };
}
