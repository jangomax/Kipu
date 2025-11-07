export interface CommitMetadata {
  commitId: string;
  timestamp: Date;
  userId: string;
  parentId?: string;
}

export interface GetCommitsResponse {
  playlistId: string;
  commits: CommitMetadata[];
}
