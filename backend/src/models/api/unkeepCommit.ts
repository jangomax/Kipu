export interface UnkeepCommitRequest {
  userId: string;
  deleteSpotifyPlaylist?: boolean;
}

export interface UnkeepCommitResponse {
  success: boolean;
  deletedSpotifyPlaylist: boolean;
}
