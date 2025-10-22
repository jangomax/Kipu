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
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';

const resolveDurationMs = (track: SpotifyPlaylistTrackItem['track']): number | undefined => {
  if (!track) {
    return undefined;
  }

  if (typeof track.durationMs === 'number') {
    return track.durationMs;
  }

  const rawTrack = track as unknown as Record<string, unknown>;

  const rawDuration = rawTrack['duration_ms'];
  if (typeof rawDuration === 'number') {
    return rawDuration;
  }

  const nestedDuration = rawTrack['duration'];
  if (
    nestedDuration &&
    typeof nestedDuration === 'object' &&
    typeof (nestedDuration as Record<string, unknown>)['ms'] === 'number'
  ) {
    return (nestedDuration as Record<string, number>)['ms'];
  }

  return undefined;
};

const formatDuration = (durationMs?: number) => {
  if (!durationMs || Number.isNaN(durationMs)) {
    return '—';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
    <Container size="lg" style={{ marginTop: '1rem' }}>
      <Stack gap="xl">
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

        <Stack gap="xs">
          {playlistTracks?.items.map((item) => {
            const track = item.track;

            if (!track) {
              return null;
            }

            const trackImage = track.album.images?.[0]?.url;
            const artists = track.artists.map((artist) => artist.name).join(', ');
            const durationMs = resolveDurationMs(track);

            return (
              <Paper key={track.id} withBorder shadow="xs" radius="md" p="md">
                <Group wrap="nowrap" gap="md" align="flex-start">
                  {trackImage ? (
                    <Image src={trackImage} alt={track.name} w={70} h={70} radius="sm" />
                  ) : (
                    <Paper
                      withBorder
                      shadow="xs"
                      radius="sm"
                      style={{
                        width: 70,
                        height: 70,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        No art
                      </Text>
                    </Paper>
                  )}
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={600}>{track.name}</Text>
                    <Text size="sm" c="dimmed">
                      {artists}
                    </Text>
                    <Group justify="space-between" gap="xs">
                      <Text size="sm" c="dimmed">
                        {track.album.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {formatDuration(durationMs)}
                      </Text>
                    </Group>
                    {track.externalUrls?.spotify && (
                      <Anchor
                        href={track.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                      >
                        Open in Spotify
                      </Anchor>
                    )}
                  </Stack>
                </Group>
              </Paper>
            );
          })}

          {playlistTracks && playlistTracks.items.length === 0 && (
            <Paper withBorder radius="md" p="xl">
              <Text c="dimmed">This playlist does not have any tracks yet.</Text>
            </Paper>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};
