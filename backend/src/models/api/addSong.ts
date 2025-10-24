export interface AddSongRequest {
  position: number;
  uris: string[];
  userId: string;
  snapshotId: string;
}

export interface AddSongResponse {
  commitId: string;
}
