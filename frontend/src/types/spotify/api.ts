import { SpotifyPlaylist } from './objects';

export interface GetPlaylistsResponse {
  href: string;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: SpotifyPlaylist[];
}
