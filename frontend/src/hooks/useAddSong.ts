import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { kipuPost } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { AddSongRequest, AddSongResponse } from '@/types/spotify';

interface AddSongParams {
  playlistId: string;
  position?: number;
  uris: string[];
  userId: string;
}

export const useAddSong = () => {
  return useMutation({
    mutationFn: async ({
      playlistId,
      position,
      uris,
      userId,
    }: AddSongParams): Promise<AddSongResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        const requestBody: AddSongRequest = {
          position,
          uris,
          userId,
        };

        return await kipuPost<AddSongResponse>(`/playlists/${playlistId}/tracks`, requestBody);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens(); // expired
        }
        throw error;
      }
    },
  });
};
