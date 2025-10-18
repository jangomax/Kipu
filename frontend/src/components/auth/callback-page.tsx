import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Container, Text, Loader, Stack, Alert } from '@mantine/core';
import { useTokenExchange } from '@/hooks/useTokenExchange';

export const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutateAsync: exchangeToken } = useTokenExchange();
  const hasExchanged = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code || hasExchanged.current) {
      return;
    }

    hasExchanged.current = true;

    exchangeToken(code)
      .then(() => {
        console.log('Token exchange successful, navigating to /');
        navigate('/');
      })
      .catch((err) => {
        console.error('Token exchange error:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate with Spotify.');
      });
  }, [searchParams, exchangeToken, navigate]);

  if (error) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Alert color="red" title="Authentication Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!searchParams.get('code')) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Alert color="red" title="Authentication Error">
          Authorization code missing from Spotify redirect.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" style={{ marginTop: '5rem' }}>
      <Stack gap="lg" align="center">
        <Loader size="xl" />
        <Text size="lg">Completing authentication...</Text>
      </Stack>
    </Container>
  );
};
