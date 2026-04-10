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

export function useGetProfile(): UseQueryResult<Profile, ApiError> {
  return useQuery<Profile, ApiError>({
    queryKey: getGetProfileQueryKey(),
    queryFn: async () => {
      return await apiClient.get<Profile>("/api/profile");
    },
  });
}

