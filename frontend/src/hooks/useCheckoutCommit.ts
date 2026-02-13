import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { CheckoutResponse } from '@/types/checkout';

export const useCheckoutCommit = (playlistId: string | undefined, commitId: string | undefined) => {
  return useQuery({
    queryKey: ['checkoutCommit', playlistId, commitId],
    queryFn: async (): Promise<CheckoutResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!playlistId) {
        throw new Error('No playlist ID provided');
      }

      if (!commitId) {
        throw new Error('No commit ID provided');
      }

      try {
        return await kipuGet<CheckoutResponse>(
          `/playlists/${playlistId}/checkout?${new URLSearchParams({ commitId }).toString()}`,
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    enabled: !!getAccessToken() && !!playlistId && !!commitId,
    retry: false,
  });
};
