import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetPlaylistsResponse, SpotifyPlaylist } from '@/types/spotify';

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['spotifyPlaylists'],
    queryFn: async (): Promise<GetPlaylistsResponse> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        let allPlaylists: SpotifyPlaylist[] = [];
        let nextUrl: string | null = '/me/playlists?limit=50';
        let offset = 0;

        while (nextUrl) {
          console.log('hi');
          const response: GetPlaylistsResponse = await spotifyGet<GetPlaylistsResponse>(nextUrl);
          allPlaylists = [...allPlaylists, ...response.items];

          // Check if there's a next page
          if (response.next) {
            offset += 50;
            nextUrl = `/me/playlists?limit=50&offset=${offset}`;
          } else {
            nextUrl = null;
          }
        }

        return {
          href: '',
          limit: allPlaylists.length,
          offset: 0,
          total: allPlaylists.length,
          items: allPlaylists,
        };
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens(); //expired
        }
        throw error;
      }
    },
    enabled: !!getAccessToken(),
    retry: false,
  });
};
