import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Text, Loader, Stack, Alert, Title, SimpleGrid } from '@mantine/core';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { usePlaylists } from '@/hooks/usePlaylists';
import { PlaylistCard } from '@/components/app/playlist';
import { getAccessToken } from '@/util/auth';

export const AppPage = () => {
  const navigate = useNavigate();
  const { data: user, isLoading: loadingUser, isError: userError } = useSpotifyUser();
  const { data: playlists, isLoading: loadingPlaylists } = usePlaylists();

  useEffect(() => {
    if (!user && !loadingUser && userError) {
      navigate('/');
    }
  }, [user, loadingUser, userError, navigate]);

  const accessToken = getAccessToken();

  useEffect(() => {
    if (!accessToken) {
      navigate('/'); // redirect if user not signed in (no access token)
    }
  }, [accessToken, navigate]);

  const loading = loadingUser || loadingPlaylists;

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

  if (userError) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Alert color="red" title="Error">
          Failed to load user information
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  if (!accessToken) {
    return null;
  }

  return (
    <Container size="xl">
      <Stack gap="md" style={{ marginTop: '2rem' }}>
        <Title order={3}>Your Playlists</Title>
        {playlists && playlists.items.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing="lg">
            {playlists.items.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed">No playlists found</Text>
        )}
      </Stack>
    </Container>
  );
};
