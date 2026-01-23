import { useEffect, useMemo } from 'react';
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
import { SongSearchResultsTable } from '@/components/app/song-search/song-search-results-table';
import { useTrackSearch } from '@/hooks/useTrackSearch';
import { useKeptCommits } from '@/hooks/useKeptCommits';
import { getAccessToken } from '@/util/auth';
import { useUiStore } from '@/stores/useUiStore';

export const AppPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const playlistId = searchParams.get('playlistId');
  const queryParam = searchParams.get('query') ?? '';
  const trimmedQuery = queryParam.trim();
  const isMobile = useUiStore((state) => state.isMobile);

  const { data: user, isLoading: loadingUser, isError: userError } = useSpotifyUser();
  const { data: playlists, isLoading: loadingPlaylists } = usePlaylists();
  const {
    data: trackSearch,
    isLoading: isSearching,
    isError: searchError,
  } = useTrackSearch(trimmedQuery);

  const { data: keptCommitsData } = useKeptCommits(user?.id);
  const keptPlaylistIds = useMemo(
    () => new Set(keptCommitsData?.keptCommits.map((kc) => kc.spotifyPlaylistId) || []),
    [keptCommitsData],
  );

  // filter out playlists that are kept commits
  const filteredPlaylists = useMemo(
    () => playlists?.items.filter((playlist) => !keptPlaylistIds.has(playlist.id)) || [],
    [playlists, keptPlaylistIds],
  );

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

  if (trimmedQuery) {
    if (isSearching) {
      return (
        <Container size="sm" style={{ marginTop: '5rem' }}>
          <Stack gap="lg" align="center">
            <Loader size="xl" />
            <Text size="lg">Searching for songs...</Text>
          </Stack>
        </Container>
      );
    }

    if (searchError) {
      return (
        <Container size="sm" style={{ marginTop: '5rem' }}>
          <Alert color="red" title="Error">
            Failed to search songs. Please try again.
          </Alert>
        </Container>
      );
    }

    const tracks = trackSearch?.items ?? [];

    return (
      <Container size="xl" px={{ base: 'sm', sm: 'md' }} style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => setSearchParams({})}
            style={{ alignSelf: 'flex-start' }}
            size="sm"
          >
            {!isMobile && 'Back to playlists'}
          </Button>
          <Stack gap="xs">
            <Title order={3}>Results for &quot;{trimmedQuery}&quot;</Title>
            <Text size="sm" c="dimmed">
              {tracks.length} {tracks.length === 1 ? 'song found' : 'songs found'}
            </Text>
          </Stack>
          <SongSearchResultsTable tracks={tracks} />
        </Stack>
      </Container>
    );
  }

  if (playlistId) {
    return (
      <Container size="xl" px={{ base: 'sm', sm: 'md' }} style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => setSearchParams({})}
            style={{ alignSelf: 'flex-start' }}
            size="sm"
          >
            {!isMobile && 'Back to Playlists'}
          </Button>

          <Group align="flex-start" gap="xl" wrap="wrap" style={{ alignItems: 'stretch' }}>
            <PlaylistSidebarList
              playlists={filteredPlaylists}
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
    <Container size="xl" px={{ base: 'sm', sm: 'md' }}>
      <Stack gap="md" style={{ marginTop: '2rem' }}>
        <Title order={3}>Your Playlists</Title>
        {filteredPlaylists.length > 0 ? (
          <SimpleGrid cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 6 }} spacing={{ base: 'sm', sm: 'md', md: 'lg' }}>
            {filteredPlaylists.map((playlist) => (
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
