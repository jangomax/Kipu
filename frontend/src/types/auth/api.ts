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

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}
