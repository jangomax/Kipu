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
  Select,
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
  const isHistoricalView = !!checkoutData && checkoutData.commitId !== commits[0]?.commitId;
  const selectedHistoricalCommit = useMemo(
    () => commits.find((commit) => commit.commitId === checkoutData?.commitId),
    [commits, checkoutData?.commitId],
  );
  const compareCommitForDiffId =
    isDiffMode && compareCommitId && compareCommitId !== ROOT_COMPARE_VALUE ? compareCommitId : undefined;

  const { data: compareCommitData, isLoading: isLoadingCompareCommit } = useCheckoutCommit(
    isHistoricalView ? playlistId : undefined,
    compareCommitForDiffId,
  );
  const historicalDiff = useMemo(() => {
    if (!isHistoricalView || !isDiffMode || !checkoutData) {
      return null;
    }
    const baselineTrackIds =
      compareCommitId === ROOT_COMPARE_VALUE ? [] : (compareCommitData?.tracks ?? []);
    return computeDiff(checkoutData.tracks, baselineTrackIds);
  }, [isHistoricalView, isDiffMode, checkoutData, compareCommitId, compareCommitData]);
  const { data: diffRemovedTrackDetails, isLoading: isLoadingDiffRemovedTracks } = useSpotifySongs(
    historicalDiff?.removedTrackIds && historicalDiff.removedTrackIds.length > 0
      ? historicalDiff.removedTrackIds
      : undefined,
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
    if (!isHistoricalView) {
      setIsDiffMode(false);
      setCompareCommitId(null);
      return;
    }

    setIsDiffMode(false);
    setCompareCommitId(selectedHistoricalCommit?.parentId || ROOT_COMPARE_VALUE);
  }, [isHistoricalView, selectedHistoricalCommit?.commitId, selectedHistoricalCommit?.parentId]);

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

  const compareCommitOptions = useMemo(() => {
    if (!checkoutData) {
      return [];
    }

    const options: { value: string; label: string }[] = [];

    if (!selectedHistoricalCommit?.parentId) {
      options.push({ value: ROOT_COMPARE_VALUE, label: 'No parent (all tracks added)' });
    }

    commits
      .filter((commit) => commit.commitId !== checkoutData.commitId)
      .forEach((commit) => {
        const isParent = commit.commitId === selectedHistoricalCommit?.parentId;
        options.push({
          value: commit.commitId,
          label: `${isParent ? 'Parent • ' : ''}${new Date(commit.timestamp).toLocaleString()}`,
        });
      });

    return options;
  }, [checkoutData, commits, selectedHistoricalCommit?.parentId]);

  const diffDisplayTracks = useMemo((): PlaylistTrackDisplayItem[] => {
    if (!historicalDiff) {
      return checkoutTracks;
    }

    const addedCounts = buildCountMap(historicalDiff.addedTrackIds);
    const removedTrackMap = new Map<string, SpotifyPlaylistTrackItem['track']>();
    diffRemovedTrackDetails?.tracks?.forEach((track) => {
      removedTrackMap.set(track.id, track);
    });

    const rows: PlaylistTrackDisplayItem[] = checkoutTracks.map((item) => {
      const trackId = item.track?.id;
      if (!trackId) {
        return { ...item, diffStatus: 'unchanged' };
      }
      const remainingAdditions = addedCounts.get(trackId) || 0;
      if (remainingAdditions > 0) {
        addedCounts.set(trackId, remainingAdditions - 1);
        return { ...item, diffStatus: 'added' };
      }
      return { ...item, diffStatus: 'unchanged' };
    });

    historicalDiff.removedTrackIds.forEach((trackId, index) => {
      const track = removedTrackMap.get(trackId);
      if (!track) {
        return;
      }
      rows.push({
        addedAt: `${checkoutData?.timestamp || 'diff'}-removed-${index}`,
        track,
        diffStatus: 'removed',
      });
    });

    return rows;
  }, [historicalDiff, checkoutTracks, diffRemovedTrackDetails, checkoutData]);

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
    !!checkoutData &&
    (isLoadingCompareCommit ||
      (compareCommitId !== ROOT_COMPARE_VALUE && !!compareCommitForDiffId && !compareCommitData) ||
      isLoadingDiffRemovedTracks);

  const displayTracks: PlaylistTrackDisplayItem[] = checkoutData
    ? isDiffMode
      ? diffDisplayTracks
      : checkoutTracks
    : tracks;

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
          playlistId={playlistId}
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
              {checkoutData && (
                <Text component="span" size="lg" c="dimmed" fw={400}>
                  {' '}
                  @ {new Date(checkoutData.timestamp).toLocaleString()}
                </Text>
              )}
            </Title>
            {isHistoricalView && (
              <Group gap="sm" wrap="wrap">
                <Button
                  size="xs"
                  variant={isDiffMode ? 'filled' : 'light'}
                  onClick={() => setIsDiffMode((current) => !current)}
                >
                  {isDiffMode ? 'Hide Diff' : 'View Diff'}
                </Button>
                {isDiffMode && (
                  <Select
                    size="xs"
                    w={{ base: 240, sm: 320 }}
                    label="Compare against"
                    data={compareCommitOptions}
                    value={compareCommitId}
                    onChange={(value) => setCompareCommitId(value)}
                    placeholder="Select a commit"
                    searchable
                    allowDeselect={false}
                  />
                )}
              </Group>
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

        {(isLoadingHistoricalVersion || (isLoadingCheckoutTracks && checkoutData) || isLoadingDiffData) &&
        checkoutData ? (
          <Stack align="center" justify="center" style={{ minHeight: 240 }}>
            <Loader size="lg" />
            <Text c="dimmed">Loading playlist...</Text>
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
