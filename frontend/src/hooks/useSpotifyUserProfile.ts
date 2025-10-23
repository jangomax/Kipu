import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { getAccessToken, clearTokens } from '@/util/auth';
import type { SpotifyPublicUser } from '@/types/spotify';

export const useSpotifyUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['spotifyUserProfile', userId],
    queryFn: async (): Promise<SpotifyPublicUser> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('No access token');
      }

      if (!userId) {
        throw new Error('No user id provided');
      }

      try {
        return await spotifyGet<SpotifyPublicUser>(`/users/${userId}`);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
    enabled: !!getAccessToken() && !!userId,
    retry: false,
  });
};
