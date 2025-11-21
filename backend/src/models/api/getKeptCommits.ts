export interface KeptCommitInfo {
  keptCommitId: string;
  commitId: string;
  spotifyPlaylistId: string;
  playlistName: string;
  keptAt: string;
}

export interface GetKeptCommitsResponse {
  keptCommits: KeptCommitInfo[];
}
