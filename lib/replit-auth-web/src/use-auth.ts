import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

const apiBase: string =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

function buildReturnTo(): string {
  const base =
    (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(
      /\/+$/,
      "",
    ) ?? "";
  return apiBase ? `${window.location.origin}${base || "/"}` : base || "/";
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiBase}/api/auth/user`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    const returnTo = buildReturnTo();
    window.location.href = `${apiBase}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const loginWithGoogle = useCallback(() => {
    const returnTo = buildReturnTo();
    window.location.href = `${apiBase}/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = `${apiBase}/api/logout`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
  };
}
