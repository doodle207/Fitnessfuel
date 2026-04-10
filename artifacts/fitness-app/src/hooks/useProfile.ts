import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiClient, type ApiError } from "./useAuth";

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export const getGetProfileQueryKey = () => ["profile"] as const;

export function useGetProfile(options?: {
  query?: { queryKey?: readonly unknown[]; enabled?: boolean };
}): UseQueryResult<Profile, ApiError> {
  return useQuery<Profile, ApiError>({
    queryKey: options?.query?.queryKey ?? getGetProfileQueryKey(),
    queryFn: async () => {
      return await apiClient.get<Profile>("/api/profile");
    },
    enabled: options?.query?.enabled ?? true,
  });
}

