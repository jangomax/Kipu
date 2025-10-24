export interface RemoveSongRequest {
  uris: string[];
  userId: string;
  snapshotId?: string;
}

export interface RemoveSongResponse {
  snapshotId: string;
  commitId: string;
}
