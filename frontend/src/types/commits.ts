export interface CommitDiff {
  added: { trackId: string }[];
  removed: { trackId: string }[];
}

export interface Commit {
  commitId: string;
  timestamp: string;
  userId: string;
  parentId?: string;
  diff: CommitDiff;
}

export interface CommitRequest {
  userId: string;
  addedUris: string[];
  removedUris: string[];
}

export interface CommitResponse {
  commitId: string;
}

export interface GetCommitsResponse {
  playlistId: string;
  commits: Commit[];
}

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

export interface KeepCommitRequest {
  userId: string;
}

export interface KeepCommitResponse {
  keptCommitId: string;
  spotifyPlaylistId: string;
  playlistName: string;
  trackCount: number;
}

export interface UnkeepCommitRequest {
  userId: string;
  deleteSpotifyPlaylist?: boolean;
}

export interface UnkeepCommitResponse {
  success: boolean;
  deletedSpotifyPlaylist: boolean;
}
