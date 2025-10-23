export interface SpotifyUser {
  displayName: string;
  email: string;
  id: string;
  images?: SpotifyImage[];
  country?: string;
  product?: string;
}

export interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyPlaylistOwner {
  externalUrls: SpotifyExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
  displayName?: string;
}

export interface SpotifyPublicUser {
  id: string;
  displayName?: string;
  href?: string;
  type?: string;
  uri?: string;
  externalUrls?: SpotifyExternalUrls;
  images?: SpotifyImage[];
}

export interface SpotifyPlaylistTracks {
  href: string;
  total: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  releaseDate: string;
  totalTracks: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  durationMs?: number;
  externalUrls: SpotifyExternalUrls;
  previewUrl?: string;
  uri: string;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  externalUrls: SpotifyExternalUrls;
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  owner: SpotifyPlaylistOwner;
  public: boolean;
  snapshotId: string;
  tracks: SpotifyPlaylistTracks;
  type: string;
  uri: string;
}

export interface SpotifyPlaylistTrackItem {
  addedAt: string;
  track: SpotifyTrack;
}
