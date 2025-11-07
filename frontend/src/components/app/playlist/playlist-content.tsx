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
import { CommitTimeline } from '@/components/app/playlist/playlist-commit-timeline';

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

  const sampleCommits = [
    {
      commitId: 'a1b2c3d4e5f6',
      userId: 'user123',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
      commitId: 'b2c3d4e5f6g7',
      userId: 'user456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
    {
      commitId: 'c3d4e5f6g7h8',
      userId: 'user123',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
    {
      commitId: 'd4e5f6g7h8i9',
      userId: 'user789',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    },
    {
      commitId: 'e5f6g7h8i9j0',
      userId: 'user456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28), // Yesterday
    },
    {
      commitId: 'f6g7h8i9j0k1',
      userId: 'user234',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      commitId: 'g7h8i9j0k1l2',
      userId: 'user123',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    },
    {
      commitId: 'h8i9j0k1l2m3',
      userId: 'user789',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    },
    {
      commitId: 'i9j0k1l2m3n4',
      userId: 'user234',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
    },
    {
      commitId: 'j0k1l2m3n4o5',
      userId: 'user456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
    },
    {
      commitId: 'k1l2m3n4o5p6',
      userId: 'user123',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25), // 25 days ago
    },
    {
      commitId: 'l2m3n4o5p6q7',
      userId: 'user789',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35), // 35 days ago
    },
    {
      commitId: 'm3n4o5p6q7r8',
      userId: 'user123',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
    },
  ];

  return (
    <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
      <CommitTimeline commits={sampleCommits} />
    </Stack>
  );

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
            <Anchor href={playlist.externalUrls.spotify} target="_blank" rel="noreferrer">
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
