import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetPlaylistTracksResponse, SpotifyPlaylistTrackItem } from '@/types/spotify';

const PAGE_SIZE = 50;

async function fetchAllPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTrackItem[]> {
  const allItems: SpotifyPlaylistTrackItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await spotifyGet<GetPlaylistTracksResponse>(
      `/playlists/${playlistId}/tracks?limit=${PAGE_SIZE}&offset=${offset}`,
    );

    allItems.push(...response.items);

    if (response.next) {
      offset += PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allItems;
}

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: ['spotifyPlaylistTracks', playlistId],
    queryFn: async (): Promise<SpotifyPlaylistTrackItem[]> => {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('No access token');
      if (!playlistId) throw new Error('No playlist id provided');

      try {
        return await fetchAllPlaylistTracks(playlistId);
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
