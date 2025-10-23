import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Anchor,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Button,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaylistTracks } from '@/hooks/usePlaylistTracks';
import { useSpotifyUserProfile } from '@/hooks/useSpotifyUserProfile';
import { PlaylistTracksTable } from './playlist-tracks-table';

export const PlaylistDetailPage = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();

  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    isError: playlistsError,
  } = usePlaylists();

  const {
    data: playlistTracks,
    isLoading: isLoadingTracks,
    isError: tracksError,
  } = usePlaylistTracks(playlistId);

  const playlist = useMemo(
    () => playlists?.items.find((item) => item.id === playlistId),
    [playlists, playlistId],
  );

  const shouldFetchOwnerProfile =
    !!playlist?.owner?.id && !playlist?.owner?.displayName && playlist?.owner?.type === 'user';
  const { data: ownerProfile } = useSpotifyUserProfile(
    shouldFetchOwnerProfile ? playlist?.owner?.id : undefined,
  );
  const ownerName = playlist?.owner.displayName || ownerProfile?.displayName || 'Unknown creator';

  const loading = isLoadingPlaylists || isLoadingTracks;

  if (!playlistId) {
    return (
      <Container size="lg" style={{ marginTop: '1rem' }}>
        <Alert color="red" title="Playlist not found">
          Missing playlist identifier.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" style={{ marginTop: '2rem' }}>
        <Stack gap="lg" align="center">
          <Loader size="lg" />
          <Text c="dimmed">Loading playlist...</Text>
        </Stack>
      </Container>
    );
  }

  if (playlistsError || tracksError) {
    return (
      <Container size="lg" style={{ marginTop: '2rem' }}>
        <Alert color="red" title="Error">
          Unable to load playlist details right now. Please try again.
        </Alert>
      </Container>
    );
  }

  if (!playlist) {
    return (
      <Container size="lg" style={{ marginTop: '2rem' }}>
        <Alert color="red" title="Playlist not available">
          We could not locate that playlist. It may have been removed or is not accessible.
        </Alert>
      </Container>
    );
  }

  const coverImage = playlist.images?.[0]?.url;

  return (
    <Container size="lg" style={{ marginTop: '1.25rem' }}>
      <Stack gap="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate(-1)}
          style={{
            alignSelf: 'flex-start',
            boxShadow: 'var(--mantine-shadow-xs)',
          }}
        >
          Back
        </Button>

        <Group align="flex-start">
          {coverImage ? (
            <Image src={coverImage} alt={playlist.name} w={200} h={200} radius="md" />
          ) : (
            <Paper
              withBorder
              shadow="sm"
              radius="md"
              style={{
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c="dimmed">No cover</Text>
            </Paper>
          )}

          <Stack gap="xs">
            <Title order={2}>{playlist.name}</Title>
            {playlist.description && <Text>{playlist.description}</Text>}
            <Text size="sm" c="dimmed">
              {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
            </Text>
            <Text size="sm" c="dimmed">
              By {ownerName}
            </Text>
            {playlist.externalUrls?.spotify && (
              <Anchor href={playlist.externalUrls.spotify} target="_blank" rel="noreferrer">
                View on Spotify
              </Anchor>
            )}
          </Stack>
        </Group>

        <PlaylistTracksTable items={playlistTracks?.items ?? []} />
      </Stack>
    </Container>
  );
};
