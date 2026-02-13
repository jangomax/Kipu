import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconHistory, IconVersions } from '@tabler/icons-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useCheckIn } from '@/hooks/useCheckIn';
import { usePlaylistTracks } from '@/hooks/usePlaylistTracks';
import { useSpotifyUserProfile } from '@/hooks/useSpotifyUserProfile';
import { useCommits } from '@/hooks/useCommits';
import { useCheckout } from '@/hooks/useCheckout';
import { useCheckoutCommit } from '@/hooks/useCheckoutCommit';
import { useSpotifySongs } from '@/hooks/useSpotifySongs';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { useCommit } from '@/hooks/useCommit';
import {
  PlaylistTracksTable,
  PlaylistTrackDisplayItem,
} from '@/components/app/playlist/playlist-tracks-table';
import { CommitTimeline } from '@/components/app/playlist/playlist-commit-timeline';
import { UncommittedChangesModal } from '@/components/app/playlist/uncommitted-changes-modal';
import { Commit } from '@/types/commits';
import { CheckoutResponse } from '@/types/checkout';
import { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PendingDiff, computeDiff } from '@/util/playlistDiff';
import { useUiStore } from '@/stores/useUiStore';

interface PlaylistContentProps {
  playlistId: string;
}

const ROOT_COMPARE_VALUE = '__root_compare__';

const buildCountMap = (ids: string[]) => {
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  return counts;
};

export const PlaylistContent = ({ playlistId }: PlaylistContentProps) => {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [hasCheckedForChanges, setHasCheckedForChanges] = useState(false);
  const [isCheckingDiff, setIsCheckingDiff] = useState(false);
  const [, setIsSyncingDiff] = useState(false);
  const [isLoadingHistoricalVersion, setIsLoadingHistoricalVersion] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [compareCommitId, setCompareCommitId] = useState<string | null>(null);
  const isMobile = useUiStore((state) => state.isMobile);

  const { data: user } = useSpotifyUser();
  const { mutate: checkout } = useCheckout();
  const { mutate: fetchLatestCommit } = useCheckout();
  const { mutate: commitChanges } = useCommit();
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn();

  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    isError: playlistsError,
  } = usePlaylists();

  const {
    data: allTracks,
    isLoading: isLoadingTracks,
    isError: tracksError,
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
  const tracks = allTracks ?? [];
  const commits = commitsData?.commits ?? [];
  const latestCommit = commits[0];
  const isHistoricalView = !!checkoutData && checkoutData.commitId !== commits[0]?.commitId;
  const selectedCommit = useMemo(
    () => commits.find((commit) => commit.commitId === checkoutData?.commitId),
    [commits, checkoutData?.commitId],
  );
  const activeCommit = isHistoricalView ? selectedCommit : latestCommit;
  const activeCommitId = activeCommit?.commitId;
  const defaultCompareCommitId = activeCommit?.parentId || ROOT_COMPARE_VALUE;

  const { data: activeCommitData, isLoading: isLoadingActiveCommitData } = useCheckoutCommit(
    !isHistoricalView && isDiffMode ? playlistId : undefined,
    !isHistoricalView && isDiffMode ? activeCommitId : undefined,
  );
  const compareCommitForDiffId =
    isDiffMode && compareCommitId && compareCommitId !== ROOT_COMPARE_VALUE ? compareCommitId : undefined;

  const { data: compareCommitData, isLoading: isLoadingCompareCommit } = useCheckoutCommit(
    isDiffMode ? playlistId : undefined,
    compareCommitForDiffId,
  );
  const activeDiffTrackIds = useMemo(() => {
    if (!isDiffMode || !activeCommit) {
      return [];
    }
    if (isHistoricalView) {
      return checkoutData?.tracks ?? [];
    }
    return activeCommitData?.tracks ?? [];
  }, [isDiffMode, activeCommit, isHistoricalView, checkoutData, activeCommitData]);

  const historicalDiff = useMemo(() => {
    if (!isDiffMode || !activeCommit) {
      return null;
    }
    const baselineTrackIds =
      compareCommitId === ROOT_COMPARE_VALUE ? [] : (compareCommitData?.tracks ?? []);
    return computeDiff(activeDiffTrackIds, baselineTrackIds);
  }, [isDiffMode, activeCommit, compareCommitId, compareCommitData, activeDiffTrackIds]);

  const compareTrackIds = isDiffMode
    ? compareCommitId === ROOT_COMPARE_VALUE
      ? []
      : (compareCommitData?.tracks ?? [])
    : [];
  const activeTrackDetailsIds = isDiffMode ? Array.from(new Set(activeDiffTrackIds)) : undefined;
  const compareTrackDetailsIds = isDiffMode ? Array.from(new Set(compareTrackIds)) : undefined;
  const { data: activeDiffTrackDetails, isLoading: isLoadingActiveDiffTrackDetails } = useSpotifySongs(
    activeTrackDetailsIds && activeTrackDetailsIds.length > 0 ? activeTrackDetailsIds : undefined,
  );
  const { data: compareDiffTrackDetails, isLoading: isLoadingCompareDiffTrackDetails } = useSpotifySongs(
    compareTrackDetailsIds && compareTrackDetailsIds.length > 0 ? compareTrackDetailsIds : undefined,
  );

  const currentTrackIds = useMemo(() => {
    const ids: string[] = [];
    tracks.forEach((item) => {
      if (item.track?.id) {
        ids.push(item.track.id);
      }
    });
    return ids;
  }, [tracks]);

  const currentTrackMap = useMemo(() => {
    const map = new Map<string, SpotifyPlaylistTrackItem['track']>();
    tracks.forEach((item) => {
      if (item.track?.id) {
        map.set(item.track.id, item.track);
      }
    });
    return map;
  }, [tracks]);

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
    setCheckoutData(null);
    setIsLoadingHistoricalVersion(false);
    setIsDiffMode(false);
    setCompareCommitId(null);
  }, [playlistId]);

  useEffect(() => {
    setIsDiffMode(false);
    setCompareCommitId(defaultCompareCommitId);
  }, [activeCommitId, defaultCompareCommitId]);

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
            if (user?.id) {
              const toUri = (trackId: string) => `spotify:track:${trackId}`;
              setIsSyncingDiff(true);
              commitChanges(
                {
                  playlistId,
                  userId: user.id,
                  addedUris: diff.addedTrackIds.map(toUri),
                  removedUris: diff.removedTrackIds.map(toUri),
                },
                {
                  onSuccess: () => {
                    setShowCommitDialog(true);
                    setIsSyncingDiff(false);
                  },
                  onError: (error) => {
                    console.error('Failed to record commit', error);
                    setIsSyncingDiff(false);
                  },
                },
              );
            }
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
    user?.id,
    isLoadingTracks,
  ]);

  const handleCommitSelect = useCallback(
    (commit: Commit) => {
      setIsLoadingHistoricalVersion(true);
      checkout(
        {
          playlistId,
          commitId: commit.commitId,
        },
        {
          onSuccess: (data) => {
            setCheckoutData(data);
            setIsLoadingHistoricalVersion(false);
            setDrawerOpened(false);
          },
          onError: () => {
            setIsLoadingHistoricalVersion(false);
          },
        },
      );
    },
    [checkout, playlistId],
  );

  const handleReturnToHead = useCallback(() => {
    setIsLoadingHistoricalVersion(false);
    setCheckoutData(null);
  }, []);

  const handleSeeDiffFromTimeline = useCallback((commit: Commit) => {
    setCompareCommitId(commit.commitId);
    setIsDiffMode(true);
    setDrawerOpened(false);
  }, []);

  const handleCheckIn = useCallback(() => {
    if (!user?.id) return;
    checkIn(
      { playlistId, userId: user.id },
      {
        onSuccess: () => {
          console.log('Playlist checked in successfully');
        },
        onError: (error) => {
          console.error('Failed to check in playlist:', error);
        },
      },
    );
  }, [checkIn, playlistId, user?.id]);

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

  const activeTrackDetailMap = useMemo(() => {
    const map = new Map<string, SpotifyPlaylistTrackItem['track']>();
    activeDiffTrackDetails?.tracks?.forEach((track) => {
      map.set(track.id, track);
    });
    return map;
  }, [activeDiffTrackDetails]);

  const compareTrackDetailMap = useMemo(() => {
    const map = new Map<string, SpotifyPlaylistTrackItem['track']>();
    compareDiffTrackDetails?.tracks?.forEach((track) => {
      map.set(track.id, track);
    });
    return map;
  }, [compareDiffTrackDetails]);

  const targetDiffTracks = useMemo((): PlaylistTrackDisplayItem[] => {
    const addedCounts = buildCountMap(historicalDiff?.addedTrackIds ?? []);
    return activeDiffTrackIds
      .map((trackId, index) => {
        const track = activeTrackDetailMap.get(trackId);
        if (!track) {
          return null;
        }

        const count = addedCounts.get(trackId) || 0;
        const diffStatus = count > 0 ? 'added' : 'unchanged';
        if (count > 0) {
          addedCounts.set(trackId, count - 1);
        }

        return {
          addedAt: `${activeCommitId || 'active'}-${index}`,
          track,
          diffStatus,
        } as PlaylistTrackDisplayItem;
      })
      .filter((item): item is PlaylistTrackDisplayItem => !!item);
  }, [historicalDiff?.addedTrackIds, activeDiffTrackIds, activeTrackDetailMap, activeCommitId]);

  const compareDiffTracks = useMemo((): PlaylistTrackDisplayItem[] => {
    const removedCounts = buildCountMap(historicalDiff?.removedTrackIds ?? []);
    return compareTrackIds
      .map((trackId, index) => {
        const track = compareTrackDetailMap.get(trackId);
        if (!track) {
          return null;
        }

        const count = removedCounts.get(trackId) || 0;
        const diffStatus = count > 0 ? 'removed' : 'unchanged';
        if (count > 0) {
          removedCounts.set(trackId, count - 1);
        }

        return {
          addedAt: `${compareCommitId || ROOT_COMPARE_VALUE}-${index}`,
          track,
          diffStatus,
        } as PlaylistTrackDisplayItem;
      })
      .filter((item): item is PlaylistTrackDisplayItem => !!item);
  }, [historicalDiff?.removedTrackIds, compareTrackIds, compareTrackDetailMap, compareCommitId]);

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

  const isLoadingDiffData =
    isDiffMode &&
    !!activeCommit &&
    (isLoadingCompareCommit ||
      (!isHistoricalView && isLoadingActiveCommitData) ||
      (compareCommitId !== ROOT_COMPARE_VALUE && !!compareCommitForDiffId && !compareCommitData) ||
      (!isHistoricalView && !!activeCommitId && !activeCommitData) ||
      isLoadingActiveDiffTrackDetails ||
      isLoadingCompareDiffTrackDetails);

  const displayTracks: PlaylistTrackDisplayItem[] = checkoutData ? checkoutTracks : tracks;
  const compareCommit = commits.find((commit) => commit.commitId === compareCommitId);
  const addedCount = historicalDiff?.addedTrackIds.length ?? 0;
  const removedCount = historicalDiff?.removedTrackIds.length ?? 0;

  return (
    <>
      <UncommittedChangesModal
        opened={showCommitDialog}
        pendingDiff={pendingDiff}
        trackInfoMap={trackInfoMap}
        isLoadingRemovedDetails={isLoadingRemovedDetails}
        onClose={() => setShowCommitDialog(false)}
      />

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
          selectedCommitId={activeCommitId ?? null}
          playlistId={playlistId}
          onSeeDiff={handleSeeDiffFromTimeline}
          compareCommitId={isDiffMode ? compareCommitId : null}
        />
      </Drawer>

      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        {commits.length === 0 && !isLoadingTracks && (
          <Alert color="yellow" title="Untracked Playlist">
            <Stack gap="sm">
              <Text size="sm">
                This playlist is not being tracked. Check it in to start tracking versions with
                Kipu.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconVersions size={16} />}
                onClick={handleCheckIn}
                loading={isCheckingIn}
                disabled={!user?.id || playlist.tracks.total === 0}
              >
                Check In Playlist
              </Button>
            </Stack>
          </Alert>
        )}

        {checkoutData && checkoutData.commitId !== commits[0]?.commitId && (
          <Alert color="blue" title="Viewing Historical Version">
            <Stack gap="sm">
              <Text size="sm">
                You are viewing this playlist as it was at{' '}
                {new Date(checkoutData.timestamp).toLocaleString()}
              </Text>
              <Button
                size="xs"
                variant="light"
                onClick={handleReturnToHead}
                style={{ width: '100%' }}
              >
                Return to Current Version
              </Button>
            </Stack>
          </Alert>
        )}

        <Group align="flex-start" gap="md" wrap="wrap">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={playlist.name}
              w={{ base: 150, sm: 200 }}
              h={{ base: 150, sm: 200 }}
              radius="md"
            />
          ) : (
            <Paper
              withBorder
              shadow="sm"
              radius="md"
              style={{
                width: 150,
                height: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c="dimmed">No cover</Text>
            </Paper>
          )}

          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <Title order={2} style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}>
              {playlist.name}
              {activeCommit && (
                <Text component="span" size="lg" c="dimmed" fw={400}>
                  {' '}
                  @{' '}
                  {new Date(
                    isHistoricalView ? (checkoutData?.timestamp ?? activeCommit.timestamp) : activeCommit.timestamp,
                  ).toLocaleString()}
                </Text>
              )}
            </Title>
            {isDiffMode && (
              <Text size="xs" c="dimmed">
                Comparing against{' '}
                {compareCommitId === ROOT_COMPARE_VALUE
                  ? 'no parent'
                  : compareCommit
                    ? new Date(compareCommit.timestamp).toLocaleString()
                    : 'selected commit'}
              </Text>
            )}
            {playlist.description && <Text size="sm">{playlist.description}</Text>}
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
          <Button
            leftSection={<IconHistory size={18} />}
            variant="light"
            onClick={() => setDrawerOpened(true)}
            size="sm"
          >
            {!isMobile && 'View History'}
          </Button>
        </Group>

        {isLoadingHistoricalVersion || (isLoadingCheckoutTracks && checkoutData) || isLoadingDiffData ? (
          <Stack align="center" justify="center" style={{ minHeight: 240 }}>
            <Loader size="lg" />
            <Text c="dimmed">Loading playlist...</Text>
          </Stack>
        ) : isDiffMode && activeCommit ? (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge color="green" variant="filled">
                  +{addedCount}
                </Badge>
                <Badge color="red" variant="filled">
                  -{removedCount}
                </Badge>
              </Group>
              <Button size="xs" variant="light" onClick={() => setIsDiffMode(false)}>
                Exit Diff
              </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper withBorder radius="md" p="sm">
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Text fw={600}>Base Commit</Text>
                    <Text size="xs" c="dimmed">
                      {compareCommitId === ROOT_COMPARE_VALUE
                        ? 'No parent'
                        : compareCommit
                          ? new Date(compareCommit.timestamp).toLocaleString()
                          : 'Selected commit'}
                    </Text>
                  </Group>
                  <Divider />
                  <PlaylistTracksTable
                    items={compareDiffTracks}
                    playlistId={playlistId}
                    showSongControls={false}
                  />
                </Stack>
              </Paper>
              <Paper withBorder radius="md" p="sm">
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Text fw={600}>{isHistoricalView ? 'Selected Commit' : 'Latest Commit'}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(activeCommit.timestamp).toLocaleString()}
                    </Text>
                  </Group>
                  <Divider />
                  <PlaylistTracksTable
                    items={targetDiffTracks}
                    playlistId={playlistId}
                    showSongControls={false}
                  />
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        ) : (
          <PlaylistTracksTable
            items={displayTracks}
            playlistId={playlistId}
            showSongControls={!isDiffMode}
          />
        )}
      </Stack>
    </>
  );
};
