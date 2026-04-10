import { useQuery } from "@tanstack/react-query";

const AUTH_TOKEN_KEY = "auth_token";

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  [key: string]: unknown;
}

export function storeAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await res.json();
  const text = await res.text();
  return text ? text : null;
}

export type ApiClient = {
  request<T = unknown>(input: string, init?: RequestInit): Promise<T>;
  get<T = unknown>(url: string, init?: RequestInit): Promise<T>;
  post<T = unknown>(url: string, body?: unknown, init?: RequestInit): Promise<T>;
};

export const apiClient: ApiClient = {
  async request<T = unknown>(input: string, init?: RequestInit) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers = new Headers(init?.headers ?? undefined);

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const res = await fetch(input, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      clearAuthToken();
      redirectToLogin();
    }

    if (!res.ok) {
      const err: ApiError = new Error(`Request failed: ${res.status}`);
      err.status = res.status;
      try {
        err.data = await parseResponse(res);
      } catch {
        err.data = undefined;
      }
      throw err;
    }

    return (await parseResponse(res)) as T;
  },

  get<T = unknown>(url: string, init?: RequestInit) {
    return apiClient.request<T>(url, { ...init, method: "GET" });
  },

  post<T = unknown>(url: string, body?: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers ?? undefined);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return apiClient.request<T>(url, {
      ...init,
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};

export function useAuth() {
  const query = useQuery<AuthUser | null, ApiError>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      return await apiClient.get<AuthUser>("/api/auth/me");
    },
    retry: (failureCount, error) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const user = query.data ?? null;
  const isAuthenticated = !!user;
  const isLoading = query.isLoading;

  function logout() {
    clearAuthToken();
    window.location.href = "/api/logout";
  }

  return { user, isLoading, isAuthenticated, logout };
}

