import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuDelete } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { RemoveSongRequest, RemoveSongResponse } from '@/types/spotify';

interface RemoveSongParams {
  playlistId: string;
  uris: string[];
  userId: string;
  snapshotId?: string;
}

export const useRemoveSong = () => {
  return useMutation({
    mutationFn: async ({
      playlistId,
      uris,
      userId,
      snapshotId,
    }: RemoveSongParams): Promise<RemoveSongResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        const requestBody: RemoveSongRequest = {
          uris,
          userId,
          snapshotId,
        };

        return await kipuDelete<RemoveSongResponse>(
          `/playlists/${playlistId}/tracks`,
          requestBody,
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens(); // expired
        }
        throw error;
      }
    },
  });
};
