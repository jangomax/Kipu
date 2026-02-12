import { useQuery } from '@tanstack/react-query';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { AxiosError } from 'axios';
import { SpotifyTrack } from '@/types/spotify';

interface GetTracksResponse {
  tracks: SpotifyTrack[];
}

const TRACKS_BATCH_SIZE = 50;

function chunkTrackIds(trackIds: string[]): string[][] {
  const chunks: string[][] = [];

  for (let i = 0; i < trackIds.length; i += TRACKS_BATCH_SIZE) {
    chunks.push(trackIds.slice(i, i + TRACKS_BATCH_SIZE));
  }

  return chunks;
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
        const trackIdChunks = chunkTrackIds(trackIds);
        const responses = await Promise.all(
          trackIdChunks.map((chunk) => spotifyGet<GetTracksResponse>(`/tracks?ids=${chunk.join(',')}`)),
        );

        return {
          tracks: responses.flatMap((response) => response.tracks),
        };
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
