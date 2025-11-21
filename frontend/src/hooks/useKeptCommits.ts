import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuGet } from '@/util/api-helper';
import { clearTokens } from '@/util/auth';
import { GetKeptCommitsResponse } from '@/types/commits';

export const useKeptCommits = (userId: string | undefined, playlistId?: string) => {
  return useQuery({
    queryKey: ['keptCommits', userId, playlistId],
    queryFn: async (): Promise<GetKeptCommitsResponse> => {
      if (!userId) {
        throw new Error('userId is required');
      }

      try {
        const params = new URLSearchParams({ userId });
        if (playlistId) {
          params.append('playlistId', playlistId);
        }

        return await kipuGet<GetKeptCommitsResponse>(`/kept?${params.toString()}`);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    enabled: !!userId,
  });
};
