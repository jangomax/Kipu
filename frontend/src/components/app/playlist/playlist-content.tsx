import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Drawer,
  Group,
  Image,
  Loader,
  Modal,
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
import { Commit } from '@/types/commits';
import { CheckoutResponse } from '@/types/checkout';
import { SpotifyPlaylistTrackItem } from '@/types/spotify';

interface PlaylistContentProps {
  playlistId: string;
}

interface PendingDiff {
  addedTrackIds: string[];
  removedTrackIds: string[];
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

  const buildCountMap = useCallback((ids: string[]) => {
    const counts = new Map<string, number>();
    ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    return counts;
  }, []);

  const computeDiff = useCallback(
    (current: string[], baseline: string[]): PendingDiff => {
      const currentCounts = buildCountMap(current);
      const baselineCounts = buildCountMap(baseline);

      const addedTrackIds: string[] = [];
      const removedTrackIds: string[] = [];

      currentCounts.forEach((count, id) => {
        const delta = count - (baselineCounts.get(id) || 0);
        if (delta > 0) {
          for (let i = 0; i < delta; i += 1) {
            addedTrackIds.push(id);
          }
        }
      });

      baselineCounts.forEach((count, id) => {
        const delta = count - (currentCounts.get(id) || 0);
        if (delta > 0) {
          for (let i = 0; i < delta; i += 1) {
            removedTrackIds.push(id);
          }
        }
      });

      return { addedTrackIds, removedTrackIds };
    },
    [buildCountMap],
  );

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

  const summarizeDiff = useCallback(
    (ids: string[]) => {
      const counts = buildCountMap(ids);
      return Array.from(counts.entries()).map(([trackId, count]) => {
        const info = trackInfoMap.get(trackId);
        const artists = info?.artists?.map((artist) => artist.name).join(', ');
        const label = info?.name ? `${info.name}${artists ? ` — ${artists}` : ''}` : trackId;
        return { trackId, count, label };
      });
    },
    [buildCountMap, trackInfoMap],
  );

  const addedSummary = useMemo(
    () => summarizeDiff(pendingDiff?.addedTrackIds ?? []),
    [pendingDiff?.addedTrackIds, summarizeDiff],
  );

  const removedSummary = useMemo(
    () => summarizeDiff(pendingDiff?.removedTrackIds ?? []),
    [pendingDiff?.removedTrackIds, summarizeDiff],
  );

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
      <Modal
        opened={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        title="Uncommitted changes"
        centered
      >
        <Stack gap="sm">
          <Text size="sm">
            We spotted changes to this playlist since the last commit. Would you like to record
            them?
          </Text>

          <Stack gap={6}>
            <Text fw={600} size="sm">
              Added
            </Text>
            {addedSummary.length === 0 ? (
              <Text size="sm" c="dimmed">
                No additions
              </Text>
            ) : (
              addedSummary.map((item) => (
                <Text key={`added-${item.trackId}`} size="sm">
                  {item.label} {item.count > 1 ? `×${item.count}` : ''}
                </Text>
              ))
            )}
          </Stack>

          <Stack gap={6}>
            <Text fw={600} size="sm">
              Removed
            </Text>
            {isLoadingRemovedDetails && removedSummary.length > 0 ? (
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm" c="dimmed">
                  Loading removed track details...
                </Text>
              </Group>
            ) : removedSummary.length === 0 ? (
              <Text size="sm" c="dimmed">
                No removals
              </Text>
            ) : (
              removedSummary.map((item) => (
                <Text key={`removed-${item.trackId}`} size="sm">
                  {item.label} {item.count > 1 ? `×${item.count}` : ''}
                </Text>
              ))
            )}
          </Stack>

          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={() => setShowCommitDialog(false)}
              disabled={isRecordingCommit}
            >
              Not now
            </Button>
            <Button onClick={handleCommitChanges} loading={isRecordingCommit}>
              Commit changes
            </Button>
          </Group>
        </Stack>
      </Modal>

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
