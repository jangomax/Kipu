export interface SpotifyUser {
  display_name: string;
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
