import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Container,
  Text,
  Loader,
  Stack,
  Alert,
  Title,
  SimpleGrid,
  Group,
  Button,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { usePlaylists } from '@/hooks/usePlaylists';
import { PlaylistCard, PlaylistContent } from '@/components/app/playlist';
import { PlaylistSidebarList } from '@/components/app/playlist/playlist-sidebar-list';
import { getAccessToken } from '@/util/auth';

export const AppPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const playlistId = searchParams.get('playlistId');

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

  if (!user || !accessToken) {
    return null;
  }

  if (playlistId) {
    return (
      <Container size="xl" style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => setSearchParams({})}
            style={{ alignSelf: 'flex-start' }}
          >
            Back to Playlists
          </Button>

          <Group align="flex-start" gap="xl" wrap="nowrap" style={{ alignItems: 'stretch' }}>
            <PlaylistSidebarList
              playlists={playlists?.items ?? []}
              currentId={playlistId}
              onSelect={(id: string) => setSearchParams({ playlistId: id })}
              loading={loadingPlaylists}
              style={{ top: '80px' }}
            />

            <PlaylistContent playlistId={playlistId} />
          </Group>
        </Stack>
      </Container>
    );
  }

  // Show playlist grid
  return (
    <Container size="xl">
      <Stack gap="md" style={{ marginTop: '2rem' }}>
        <Title order={3}>Your Playlists</Title>
        {playlists && playlists.items.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing="lg">
            {playlists.items.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onSelect={(id: string) => setSearchParams({ playlistId: id })}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed">No playlists found</Text>
        )}
      </Stack>
    </Container>
  );
};
