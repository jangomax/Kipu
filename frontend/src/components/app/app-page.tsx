import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Container, Text, Loader, Stack, Alert, Card, Avatar, Group, Title } from '@mantine/core';
import { clearTokens } from '@/util/auth';

interface SpotifyUser {
  display_name: string;
  email: string;
  id: string;
  images?: { url: string }[];
  country?: string;
  product?: string;
}

export const AppPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const accessToken = localStorage.getItem('spotify_access_token');

      if (!accessToken) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearTokens();
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch user info');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  if (loading) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Stack gap="lg" align="center">
          <Loader size="xl" />
          <Text size="lg">Loading your profile...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Alert color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container size="md" style={{ marginTop: '3rem' }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group>
          {user.images && user.images.length > 0 && (
            <Avatar src={user.images[0].url} size="xl" radius="xl" />
          )}
          <Stack gap="xs">
            <Title order={2}>{user.display_name}</Title>
            <Text size="sm" c="dimmed">
              {user.email}
            </Text>
            {user.product && (
              <Text size="sm" c="dimmed">
                Spotify {user.product.charAt(0).toUpperCase() + user.product.slice(1)}
              </Text>
            )}
          </Stack>
        </Group>
      </Card>

      <Stack gap="md" style={{ marginTop: '2rem' }}>
        <Title order={3}>Welcome to Kipu!</Title>
        <Text>Your Spotify account has been successfully connected.</Text>
      </Stack>
    </Container>
  );
};
