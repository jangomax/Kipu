import { useQuery } from '@tanstack/react-query';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import { AxiosError } from 'axios';
import { SpotifyUser } from '@/types';

export const useSpotifyUser = () => {
  return useQuery({
    queryKey: ['spotifyUser'],
    queryFn: async (): Promise<SpotifyUser> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        return await spotifyGet<SpotifyUser>('/me');
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
