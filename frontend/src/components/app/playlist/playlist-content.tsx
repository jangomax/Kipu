import { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Drawer,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaylistTracks } from '@/hooks/usePlaylistTracks';
import { useSpotifyUserProfile } from '@/hooks/useSpotifyUserProfile';
import { useCommits } from '@/hooks/useCommits';
import { useCheckout } from '@/hooks/useCheckout';
import { useSpotifySongs } from '@/hooks/useSpotifySongs';
import { PlaylistTracksTable } from '@/components/app/playlist/playlist-tracks-table';
import { CommitTimeline } from '@/components/app/playlist/playlist-commit-timeline';
import { Commit } from '@/types/commits';
import { CheckoutResponse } from '@/types/checkout';
import { SpotifyPlaylistTrackItem } from '@/types/spotify';

interface PlaylistContentProps {
  playlistId: string;
}

export const PlaylistContent = ({ playlistId }: PlaylistContentProps) => {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);

  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();

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

  const { data: commitsData } = useCommits(playlistId);

  const { data: checkoutTracksData, isLoading: isLoadingCheckoutTracks } = useSpotifySongs(
    checkoutData?.tracks,
  );

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

  const handleCommitSelect = useCallback(
    (commit: Commit) => {
      checkout(
        {
          playlistId,
          commitId: commit.commitId,
        },
        {
          onSuccess: (data) => {
            setCheckoutData(data);
            setDrawerOpened(false);
          },
        },
      );
    },
    [checkout, playlistId],
  );

  const handleReturnToHead = useCallback(() => {
    setCheckoutData(null);
  }, []);

  // Convert checkout tracks to PlaylistTrackItem format
  const checkoutTracks = useMemo((): SpotifyPlaylistTrackItem[] => {
    if (!checkoutTracksData?.tracks) return [];
    return checkoutTracksData.tracks
      .filter((track) => track !== null)
      .map((track) => ({
        addedAt: checkoutData?.timestamp || new Date().toISOString(),
        track,
      }));
  }, [checkoutTracksData, checkoutData]);

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

  const allTracks = tracksPages?.pages.flatMap((page) => page.items) ?? [];
  const commits = commitsData?.commits ?? [];
  const displayTracks = checkoutData ? checkoutTracks : allTracks;

  return (
    <>
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        title="Playlist History"
        padding="md"
      >
        <CommitTimeline
          commits={commits}
          onCommitSelect={handleCommitSelect}
          playlistId={playlistId}
        />
      </Drawer>

      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        {checkoutData && (
          <Alert color="blue" title="Viewing Historical Version">
            <Group justify="space-between" align="center">
              <Text size="sm">
                You are viewing this playlist as it was at{' '}
                {new Date(checkoutData.timestamp).toLocaleString()}
              </Text>
              <Button size="xs" variant="light" onClick={handleReturnToHead}>
                Return to Current Version
              </Button>
            </Group>
          </Alert>
        )}

        <Group justify="flex-end">
          <Button
            leftSection={<IconHistory size={18} />}
            variant="light"
            onClick={() => setDrawerOpened(true)}
          >
            View History
          </Button>
        </Group>

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
            <Title order={2}>
              {playlist.name}
              {checkoutData && (
                <Text component="span" size="lg" c="dimmed" fw={400}>
                  {' '}
                  @ {new Date(checkoutData.timestamp).toLocaleString()}
                </Text>
              )}
            </Title>
            {playlist.description && <Text>{playlist.description}</Text>}
            <Text size="sm" c="dimmed">
              {checkoutData
                ? `${checkoutData.tracks.length} ${
                    checkoutData.tracks.length === 1 ? 'track' : 'tracks'
                  }`
                : `${playlist.tracks.total} ${playlist.tracks.total === 1 ? 'track' : 'tracks'}`}
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

        {isLoadingCheckoutTracks && checkoutData ? (
          <Stack align="center" justify="center" style={{ minHeight: 240 }}>
            <Loader size="lg" />
            <Text c="dimmed">Loading tracks from this version...</Text>
          </Stack>
        ) : (
          <PlaylistTracksTable items={displayTracks} playlistId={playlistId} />
        )}

        {!checkoutData && hasNextPage && (
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
    </>
  );
};
