import { useMemo } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaylistTracks } from '@/hooks/usePlaylistTracks';
import { useSpotifyUserProfile } from '@/hooks/useSpotifyUserProfile';
import { PlaylistTracksTable } from '@/components/app/playlist/playlist-tracks-table';

interface PlaylistContentProps {
  playlistId: string;
}

export const PlaylistContent = ({ playlistId }: PlaylistContentProps) => {
  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    isError: playlistsError,
  } = usePlaylists();

  const {
    data: tracksPages,
    isLoading: isLoadingTracks,
    isError: tracksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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
  const coverImage = playlist?.images?.[0]?.url;

  if (playlistsError || tracksError) {
    return (
      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        <Alert color="red" title="Error">
          Unable to load playlist details right now. Please try again.
        </Alert>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Stack
        gap="sm"
        align="center"
        justify="center"
        style={{ flex: 1, minWidth: 0, minHeight: 240 }}
      >
        <Loader size="lg" />
        <Text c="dimmed">Loading playlist...</Text>
      </Stack>
    );
  }

  if (!playlist) {
    return (
      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        <Alert color="red" title="Playlist not available">
          We could not locate that playlist. It may have been removed or is not accessible.
        </Alert>
      </Stack>
    );
  }

  // Flatten all pages of tracks
  const allTracks = tracksPages?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
      <Group align="flex-start" gap="md" wrap="wrap">
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

        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Title order={2}>{playlist.name}</Title>
          {playlist.description && <Text>{playlist.description}</Text>}
          <Text size="sm" c="dimmed">
            {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
          </Text>
          <Text size="sm" c="dimmed">
            By {ownerName}
          </Text>
          {playlist.externalUrls?.spotify && (
            <Anchor
              href={playlist.externalUrls.spotify}
              target="_blank"
              rel="noreferrer"
              w="fit-content"
            >
              View on Spotify
            </Anchor>
          )}
        </Stack>
      </Group>

      <PlaylistTracksTable items={allTracks} playlistId={playlistId} />

      {hasNextPage && (
        <Group justify="center" mt="md">
          <Button
            variant="subtle"
            fullWidth
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </Button>
        </Group>
      )}
    </Stack>
  );
};
