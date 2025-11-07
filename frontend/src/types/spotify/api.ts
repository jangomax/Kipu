import { SpotifyPlaylist, SpotifyPlaylistTrackItem, SpotifyTrack } from './objects';

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
  snapshotId: string;
}

export interface RemoveSongRequest {
  uris: string[];
  userId: string;
  snapshotId?: string;
}

export interface RemoveSongResponse {
  snapshotId: string;
  commitId: string;
}

export interface SearchTracksResponse {
  tracks: {
    href: string;
    items: SpotifyTrack[];
    limit: number;
    next?: string;
    offset: number;
    previous?: string;
    total: number;
  };
}
