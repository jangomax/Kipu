import { useInfiniteQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetPlaylistTracksResponse } from '@/types/spotify';

const PAGE_SIZE = 50;

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['spotifyPlaylistTracks', playlistId],
    queryFn: async ({ pageParam = 0 }): Promise<GetPlaylistTracksResponse> => {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('No access token');
      if (!playlistId) throw new Error('No playlist id provided');

      try {
        return await spotifyGet<GetPlaylistTracksResponse>(
          `/playlists/${playlistId}/tracks?limit=${PAGE_SIZE}&offset=${pageParam}`,
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      // Spotify returns `next` as a URL or `null` if no more pages
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!getAccessToken() && !!playlistId,
    retry: false,
  });
};
