export interface KeepCommitRequest {
  userId: string;
}

export interface KeepCommitResponse {
  keptCommitId: string;
  spotifyPlaylistId: string;
  playlistName: string;
  trackCount: number;
}
