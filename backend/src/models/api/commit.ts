export interface CommitRequest {
  userId: string;
  addedUris: string[];
  removedUris: string[];
}

export interface CommitResponse {
  commitId: string;
}
