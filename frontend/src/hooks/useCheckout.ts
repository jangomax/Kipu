import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { CheckoutResponse } from '@/types/checkout';

interface CheckoutParams {
  playlistId: string;
  commitId?: string;
  latestCommitTime?: string;
}

export const useCheckout = () => {
  return useMutation({
    mutationFn: async ({
      playlistId,
      commitId,
      latestCommitTime,
    }: CheckoutParams): Promise<CheckoutResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!commitId && !latestCommitTime) {
        throw new Error('Either commitId or latestCommitTime must be provided');
      }

      if (commitId && latestCommitTime) {
        throw new Error('Only one of commitId or latestCommitTime can be provided');
      }

      try {
        const queryParams = new URLSearchParams();
        if (commitId) {
          queryParams.append('commitId', commitId);
        }
        if (latestCommitTime) {
          queryParams.append('latestCommitTime', latestCommitTime);
        }

        return await kipuGet<CheckoutResponse>(
          `/playlists/${playlistId}/checkout?${queryParams.toString()}`,
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
  });
};
