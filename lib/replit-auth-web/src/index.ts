import { useState, useEffect, useCallback } from "react";
import { createClient, type User, type Session } from "@supabase/supabase-js";

const supabaseUrl =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ??
  "https://placeholder.supabase.co";

const supabaseAnonKey =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { User };

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    firstName:
      meta.given_name ??
      meta.full_name?.split(" ")[0] ??
      meta.name?.split(" ")[0] ??
      null,
    lastName:
      meta.family_name ??
      meta.full_name?.split(" ").slice(1).join(" ") ??
      null,
    profileImageUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

const SITE_URL =
  ((import.meta as any).env?.VITE_SITE_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "");

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(toAuthUser(data.session?.user ?? null));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(toAuthUser(newSession?.user ?? null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: SITE_URL },
    });
  }, []);

  const loginWithGoogle = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: SITE_URL },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    isAuthenticated: user !== null,
    isLoading,
    login,
    loginWithGoogle,
    logout,
  };
}
