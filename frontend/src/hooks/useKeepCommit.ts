import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuPost } from '@/util/api-helper';
import { clearTokens } from '@/util/auth';
import { KeepCommitResponse } from '@/types/commits';

interface KeepCommitParams {
  playlistId: string;
  commitId: string;
  userId: string;
}

export const useKeepCommit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      commitId,
      userId,
    }: KeepCommitParams): Promise<KeepCommitResponse> => {
      try {
        return await kipuPost<KeepCommitResponse>(
          `/playlists/${playlistId}/commits/${commitId}/keep`,
          { userId },
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['keptCommits', variables.userId],
      });
    },
  });
};
