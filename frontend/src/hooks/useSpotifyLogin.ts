import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/util/constants';
import { generateCodeVerifier, setCodeVerifier } from '@/util/auth';
import { LoginResponse } from '@/types';

export const useSpotifyLogin = () => {
  return useMutation({
    mutationFn: async () => {
      const codeVerifier = generateCodeVerifier();
      setCodeVerifier(codeVerifier);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code_verifier: codeVerifier }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate login');
      }

      const data: LoginResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
  });
};
