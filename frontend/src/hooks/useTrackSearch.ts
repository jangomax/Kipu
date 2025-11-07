import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { spotifyGet } from '@/util/api-helper';
import { clearTokens, getAccessToken } from '@/util/auth';
import type { SearchTracksResponse } from '@/types/spotify';

export const useTrackSearch = (query: string) => {
  return useQuery({
    queryKey: ['spotifyTrackSearch', query],
    enabled: !!getAccessToken() && query.trim().length > 0,
    queryFn: async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        const encodedQuery = encodeURIComponent(query.trim());
        const response = await spotifyGet<SearchTracksResponse>(
          `/search?type=track&limit=25&q=${encodedQuery}`,
        );
        return response.tracks;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          clearTokens();
        }
        throw error;
      }
    },
  });
};
