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

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
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
