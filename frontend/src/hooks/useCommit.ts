import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuPost } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { CommitRequest, CommitResponse } from '@/types/commits';

interface CommitParams extends CommitRequest {
  playlistId: string;
}

export const useCommit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      userId,
      addedUris,
      removedUris,
    }: CommitParams): Promise<CommitResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!playlistId) {
        throw new Error('No playlist ID provided');
      }

      try {
        return await kipuPost<CommitResponse>(`/playlists/${playlistId}/commit`, {
          userId,
          addedUris,
          removedUris,
        });
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commits', variables.playlistId] });
    },
  });
};
