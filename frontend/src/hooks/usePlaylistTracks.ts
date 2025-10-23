import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetPlaylistTracksResponse } from '@/types/spotify';

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: ['spotifyPlaylistTracks', playlistId],
    queryFn: async (): Promise<GetPlaylistTracksResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!playlistId) {
        throw new Error('No playlist id provided');
      }

      try {
        return spotifyGet<GetPlaylistTracksResponse>(`/playlists/${playlistId}/tracks`);
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
