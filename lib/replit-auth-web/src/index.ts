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

const TOKEN_KEY = "caloforge_jwt";

export function storeAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function fetchCurrentUser(): Promise<{ user: AuthUser | null; token?: string }> {
  try {
    const headers: Record<string, string> = {};
    const stored = getAuthToken();
    if (stored) {
      headers["Authorization"] = `Bearer ${stored}`;
    }
    const res = await fetch("/api/auth/user", { credentials: "include", headers });
    if (!res.ok) return { user: null };
    const data = await res.json();
    if (data?.token) storeAuthToken(data.token);
    return { user: data?.user ?? null, token: data?.token };
  } catch {
    return { user: null };
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then(({ user: u }) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = "/api/auth/google/login";
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    window.location.href = "/api/logout";
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
