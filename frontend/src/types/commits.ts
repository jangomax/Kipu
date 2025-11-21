export interface Commit {
  commitId: string;
  timestamp: string;
  userId: string;
  parentId?: string;
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
