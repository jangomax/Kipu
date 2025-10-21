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
  displayName: string;
}

export interface SpotifyPlaylistTracks {
  href: string;
  total: number;
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
