export interface LoginRequest {
  code_verifier: string;
}

export interface LoginResponse {
  auth_url: string;
}

export interface TokenExchangeRequest {
  code: string;
  code_verifier: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
