import { useQuery } from '@tanstack/react-query';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { AxiosError } from 'axios';
import { SpotifyTrack } from '@/types/spotify';

interface GetTracksResponse {
  tracks: SpotifyTrack[];
}

export const useSpotifySongs = (trackIds: string[] | undefined) => {
  return useQuery({
    queryKey: ['spotifySongs', trackIds],
    queryFn: async (): Promise<GetTracksResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!trackIds || trackIds.length === 0) {
        throw new Error('No track IDs provided');
      }

      try {
        return await spotifyGet<GetTracksResponse>(`/tracks?ids=${trackIds.join(',')}`);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    enabled: !!getAccessToken() && !!trackIds && trackIds.length > 0,
    retry: false,
  });
};
