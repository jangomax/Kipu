export interface AddSongRequest {
  position: number;
  uris: string[];
  userId: string;
}

export interface AddSongResponse {
  commitId: string;
}
