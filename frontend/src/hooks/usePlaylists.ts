import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { GetPlaylistsResponse } from '@/types/spotify';

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['spotifyPlaylists'],
    queryFn: async (): Promise<GetPlaylistsResponse> => {
      const accessToken = getAccessToken();

      console.log('inside getplaylist');

      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        return await spotifyGet<GetPlaylistsResponse>('/me/playlists');
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
