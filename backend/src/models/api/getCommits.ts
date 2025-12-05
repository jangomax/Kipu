export interface CommitMetadata {
  commitId: string;
  timestamp: Date;
  userId: string;
  parentId?: string;
  diff: {
    added: { trackId: string }[];
    removed: { trackId: string }[];
  };
}

export interface GetCommitsResponse {
  playlistId: string;
  commits: CommitMetadata[];
}
