export interface CheckoutRequest {
  playlistId: string;
  commitId?: string;
  latestCommitTime?: string;
}

export interface CheckoutResponse {
  playlistId: string;
  commitId: string;
  tracks: string[];
  timestamp: string;
}
