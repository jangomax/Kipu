import { API_BASE_URL } from './constants';
import type { RefreshTokenResponse } from '@/types/auth';

export const generateCodeVerifier = (length = 64): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('spotify_access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('spotify_refresh_token');
};

export const getTokenExpiresAt = (): number | null => {
  const expiresAt = localStorage.getItem('spotify_token_expires_at');
  return expiresAt ? Number(expiresAt) : null;
};

export const setTokens = (accessToken: string, refreshToken: string, expiresIn: number): void => {
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
  localStorage.setItem('spotify_token_expires_at', String(Date.now() + expiresIn * 1000));
};

export const updateAccessToken = (
  accessToken: string,
  expiresIn: number,
  refreshToken?: string,
): void => {
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_token_expires_at', String(Date.now() + expiresIn * 1000));
  if (refreshToken) {
    localStorage.setItem('spotify_refresh_token', refreshToken);
  }
};

export const isAccessTokenExpired = (bufferMs = 30000): boolean => {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= expiresAt - bufferMs;
};

export const clearTokens = (): void => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expires_at');
};

export const setCodeVerifier = (verifier: string): void => {
  localStorage.setItem('code_verifier', verifier);
};

export const getCodeVerifier = (): string | null => {
  return localStorage.getItem('code_verifier');
};

export const clearCodeVerifier = (): void => {
  localStorage.removeItem('code_verifier');
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const tokenData: RefreshTokenResponse = await response.json();
  updateAccessToken(tokenData.access_token, tokenData.expires_in, tokenData.refresh_token);
  return tokenData.access_token;
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  if (!isAccessTokenExpired()) {
    return accessToken;
  }

  return refreshAccessToken();
};
