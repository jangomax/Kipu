import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetCommitsResponse } from '@/types/commits';

export const useCommits = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: ['commits', playlistId],
    queryFn: async (): Promise<GetCommitsResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!playlistId) {
        throw new Error('No playlist ID provided');
      }

      try {
        return await kipuGet<GetCommitsResponse>(`/playlists/${playlistId}/commits`);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    enabled: !!getAccessToken() && !!playlistId,
    retry: false,
  });
};
