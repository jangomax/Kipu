import { SpotifyPlaylist, SpotifyPlaylistTrackItem } from './objects';

export interface GetPlaylistsResponse {
  href: string;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: SpotifyPlaylist[];
}

export interface GetPlaylistTracksResponse {
  href: string;
  items: SpotifyPlaylistTrackItem[];
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
}

export interface AddSongRequest {
  userId: string;
  uris: string[];
  position?: number;
}

export interface AddSongResponse {
  commitId: string;
}
