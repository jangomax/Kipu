import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuDelete } from '@/util/api-helper';
import { clearTokens } from '@/util/auth';
import { UnkeepCommitResponse } from '@/types/commits';

interface UnkeepCommitParams {
  playlistId: string;
  commitId: string;
  userId: string;
  deleteSpotifyPlaylist?: boolean;
}

export const useUnkeepCommit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      commitId,
      userId,
      deleteSpotifyPlaylist,
    }: UnkeepCommitParams): Promise<UnkeepCommitResponse> => {
      try {
        return await kipuDelete<UnkeepCommitResponse>(
          `/playlists/${playlistId}/commits/${commitId}/keep`,
          { userId, deleteSpotifyPlaylist }
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate all kept commits queries for this user
      queryClient.invalidateQueries({
        queryKey: ['keptCommits', variables.userId],
      });
    },
  });
};
