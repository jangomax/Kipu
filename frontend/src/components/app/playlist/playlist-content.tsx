import { useMemo, useState, useCallback, useEffect } from 'react';
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
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { useCommit } from '@/hooks/useCommit';
import { PlaylistTracksTable } from '@/components/app/playlist/playlist-tracks-table';
import { CommitTimeline } from '@/components/app/playlist/playlist-commit-timeline';
import { UncommittedChangesModal } from '@/components/app/playlist/uncommitted-changes-modal';
import { Commit } from '@/types/commits';
import { CheckoutResponse } from '@/types/checkout';
import { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PendingDiff, computeDiff } from '@/util/playlistDiff';

interface PlaylistContentProps {
  playlistId: string;
}

export const PlaylistContent = ({ playlistId }: PlaylistContentProps) => {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [hasCheckedForChanges, setHasCheckedForChanges] = useState(false);
  const [isCheckingDiff, setIsCheckingDiff] = useState(false);

  const { data: user } = useSpotifyUser();
  const { mutate: checkout } = useCheckout();
  const { mutate: fetchLatestCommit } = useCheckout();
  const { mutate: commitChanges, isPending: isRecordingCommit } = useCommit();

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
  const { data: removedTrackDetails, isLoading: isLoadingRemovedDetails } = useSpotifySongs(
    pendingDiff?.removedTrackIds && pendingDiff.removedTrackIds.length > 0
      ? pendingDiff.removedTrackIds
      : undefined,
  );

  const allTracks = tracksPages?.pages.flatMap((page) => page.items) ?? [];
  const commits = commitsData?.commits ?? [];

  const currentTrackIds = useMemo(() => {
    const ids: string[] = [];
    allTracks.forEach((item) => {
      if (item.track?.id) {
        ids.push(item.track.id);
      }
    });
    return ids;
  }, [allTracks]);

  const currentTrackMap = useMemo(() => {
    const map = new Map<string, SpotifyPlaylistTrackItem['track']>();
    allTracks.forEach((item) => {
      if (item.track?.id) {
        map.set(item.track.id, item.track);
      }
    });
    return map;
  }, [allTracks]);

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

  const trackInfoMap = useMemo(() => {
    const map = new Map(currentTrackMap);
    removedTrackDetails?.tracks?.forEach((track) => {
      map.set(track.id, track);
    });
    return map;
  }, [currentTrackMap, removedTrackDetails]);

  useEffect(() => {
    setHasCheckedForChanges(false);
    setPendingDiff(null);
    setShowCommitDialog(false);
  }, [playlistId]);

  useEffect(() => {
    if (checkoutData) {
      console.log('Commit check skipped: viewing historical checkout');
      return; // don't prompt while browsing history
    }
    if (hasCheckedForChanges) {
      console.log('Commit check skipped: already checked for changes');
      return;
    }
    if (isCheckingDiff) {
      console.log('Commit check skipped: already checking');
      return;
    }
    if (!playlistId) {
      console.log('Commit check skipped: missing playlistId');
      return;
    }
    if (isLoadingTracks) {
      console.log('Commit check waiting: tracks still loading');
      return;
    }
    if (!commits.length) {
      console.log('Commit check skipped: no commits found');
      setHasCheckedForChanges(true);
      return;
    }

    const latestCommitId = commits[0]?.commitId;
    if (!latestCommitId) {
      console.log('Commit check skipped: latest commit is missing an id');
      setHasCheckedForChanges(true);
      return;
    }

    console.log('Commit check starting', {
      latestCommitId,
      currentTrackIds,
    });

    setIsCheckingDiff(true);

    fetchLatestCommit(
      { playlistId, commitId: latestCommitId },
      {
        onSuccess: (data) => {
          const baselineTrackIds = data.tracks || [];
          const diff = computeDiff(currentTrackIds, baselineTrackIds);
          console.log('Commit check', {
            latestCommitId,
            baselineTrackIds,
            currentTrackIds,
            added: diff.addedTrackIds,
            removed: diff.removedTrackIds,
          });
          if (diff.addedTrackIds.length || diff.removedTrackIds.length) {
            setPendingDiff(diff);
            setShowCommitDialog(true);
          }
          setHasCheckedForChanges(true);
          setIsCheckingDiff(false);
        },
        onError: (error) => {
          console.error('Commit check failed', error);
          setHasCheckedForChanges(true);
          setIsCheckingDiff(false);
        },
      },
    );
  }, [
    checkoutData,
    hasCheckedForChanges,
    playlistId,
    commits,
    fetchLatestCommit,
    computeDiff,
    currentTrackIds,
    isLoadingTracks,
  ]);

  const handleCommitChanges = useCallback(async () => {
    if (!pendingDiff || !user?.id) {
      console.error('Missing data to commit changes');
      return;
    }

    const toUri = (trackId: string) => `spotify:track:${trackId}`;

    commitChanges(
      {
        playlistId,
        userId: user.id,
        addedUris: pendingDiff.addedTrackIds.map(toUri),
        removedUris: pendingDiff.removedTrackIds.map(toUri),
      },
      {
        onSuccess: () => {
          setShowCommitDialog(false);
          setPendingDiff(null);
        },
        onError: (error) => {
          console.error('Failed to record commit', error);
        },
      },
    );
  }, [commitChanges, pendingDiff, playlistId, user?.id]);

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

  const displayTracks = checkoutData ? checkoutTracks : allTracks;

  return (
    <>
      <UncommittedChangesModal
        opened={showCommitDialog}
        pendingDiff={pendingDiff}
        trackInfoMap={trackInfoMap}
        isLoadingRemovedDetails={isLoadingRemovedDetails}
        onClose={() => setShowCommitDialog(false)}
        onCommit={handleCommitChanges}
        isCommitPending={isRecordingCommit}
      />

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        title="Playlist History"
        padding="md"
      >
        <CommitTimeline commits={commits} onCommitSelect={handleCommitSelect} />
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
