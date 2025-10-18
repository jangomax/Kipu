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

export const setTokens = (accessToken: string, refreshToken: string, expiresIn: number): void => {
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
  localStorage.setItem('spotify_token_expires_at', String(Date.now() + expiresIn * 1000));
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
