export interface Commit {
  commitId: string;
  timestamp: string;
  userId: string;
  parentId?: string;
}

export interface GetCommitsResponse {
  playlistId: string;
  commits: Commit[];
}
