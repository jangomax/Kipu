import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/util/constants';
import { getCodeVerifier, clearCodeVerifier, setTokens } from '@/util/auth';
import { TokenExchangeResponse } from '@/types/auth';

export const useTokenExchange = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const codeVerifier = getCodeVerifier();

      if (!codeVerifier) {
        throw new Error('Code verifier missing');
      }

      const response = await fetch(`${API_BASE_URL}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData: TokenExchangeResponse = await response.json();
      return tokenData;
    },
    onSuccess: (tokenData) => {
      clearCodeVerifier();
      setTokens(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in);
    },
  });
};
