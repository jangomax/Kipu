import { useCallback, useMemo, useState } from 'react';
import { ActionIcon, Loader, Menu } from '@mantine/core';
import { IconChevronRight, IconDots, IconPlus, IconTrash } from '@tabler/icons-react';
import type { GetPlaylistTracksResponse, SpotifyPlaylistTrackItem, SpotifyTrack } from '@/types/spotify';
import { useAddSong } from '@/hooks/useAddSong';
import { useRemoveSong } from '@/hooks/useRemoveSong';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { useCommit } from '@/hooks/useCommit';
import { useSpotifySongs } from '@/hooks/useSpotifySongs';
import { UncommittedChangesModal } from '@/components/app/playlist/uncommitted-changes-modal';
import { kipuGet, spotifyGet } from '@/util/api-helper';
import { PendingDiff, computeDiff } from '@/util/playlistDiff';
import { GetCommitsResponse } from '@/types/commits';
import { CheckoutResponse } from '@/types/checkout';

export interface PlaylistSongControlsProps {
  track: SpotifyTrack | null | undefined;
  playlistId?: string;
  onRemoveSong?: () => void;
}

interface AddSongParams {
  playlistId: string;
  uris: string[];
  userId: string;
}

export const PlaylistSongControls = ({ track, playlistId, onRemoveSong }: PlaylistSongControlsProps) => {
  const { data: user } = useSpotifyUser();
  const { data: playlistsData, isLoading: isLoadingPlaylists } = usePlaylists();
  const { mutateAsync: addSongAsync, isPending: isAddPending } = useAddSong();
  const { mutate: removeSong, isPending: isRemovePending } = useRemoveSong();
  const { mutate: commitChanges, isPending: isRecordingCommit } = useCommit();

  const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
  const [showUncommittedModal, setShowUncommittedModal] = useState(false);
  const [uncommittedPlaylistId, setUncommittedPlaylistId] = useState<string | null>(null);
  const [pendingAddParams, setPendingAddParams] = useState<AddSongParams | null>(null);
  const [trackInfoMap, setTrackInfoMap] = useState<Map<string, SpotifyTrack | undefined>>(new Map());
  const [isCheckingForChanges, setIsCheckingForChanges] = useState(false);

  const { data: removedTrackDetails, isLoading: isLoadingRemovedDetails } = useSpotifySongs(
    pendingDiff?.removedTrackIds && pendingDiff.removedTrackIds.length > 0
      ? pendingDiff.removedTrackIds
      : undefined,
  );

  const combinedTrackInfoMap = useMemo(() => {
    const map = new Map(trackInfoMap);
    removedTrackDetails?.tracks?.forEach((removedTrack) => {
      map.set(removedTrack.id, removedTrack);
    });
    return map;
  }, [removedTrackDetails, trackInfoMap]);

  if (!track) {
    return null;
  }

  const canRemove = Boolean(playlistId);
  const isWorking = isAddPending || isRemovePending || isCheckingForChanges || isRecordingCommit;

  const resetUncommittedState = useCallback(() => {
    setShowUncommittedModal(false);
    setPendingDiff(null);
    setUncommittedPlaylistId(null);
    setPendingAddParams(null);
    setTrackInfoMap(new Map());
  }, []);

  const fetchAllPlaylistTracks = useCallback(
    async (targetPlaylistId: string): Promise<SpotifyPlaylistTrackItem[]> => {
      const PAGE_SIZE = 100;
      let offset = 0;
      let items: SpotifyPlaylistTrackItem[] = [];
      let hasNext = true;

      while (hasNext) {
        const page = await spotifyGet<GetPlaylistTracksResponse>(
          `/playlists/${targetPlaylistId}/tracks?limit=${PAGE_SIZE}&offset=${offset}`,
        );
        items = [...items, ...page.items];
        if (!page.next) {
          hasNext = false;
        } else {
          const nextOffset = new URL(page.next).searchParams.get('offset');
          offset = nextOffset ? parseInt(nextOffset, 10) : offset + PAGE_SIZE;
        }
      }

      return items;
    },
    [],
  );

  const checkForUncommittedChanges = useCallback(
    async (targetPlaylistId: string) => {
      try {
        setIsCheckingForChanges(true);
        const commitsResponse = await kipuGet<GetCommitsResponse>(
          `/playlists/${targetPlaylistId}/commits`,
        );
        const latestCommitId = commitsResponse.commits?.[0]?.commitId;
        if (!latestCommitId) {
          return null;
        }

        const checkoutResponse = await kipuGet<CheckoutResponse>(
          `/playlists/${targetPlaylistId}/checkout?commitId=${latestCommitId}`,
        );

        const baselineTrackIds = checkoutResponse.tracks || [];
        const currentTracks = await fetchAllPlaylistTracks(targetPlaylistId);
        const currentTrackIds = currentTracks
          .map((item) => item.track?.id)
          .filter((id): id is string => Boolean(id));

        const nextTrackInfoMap = new Map<string, SpotifyTrack>();
        currentTracks.forEach((item) => {
          if (item.track?.id) {
            nextTrackInfoMap.set(item.track.id, item.track);
          }
        });

        const diff = computeDiff(currentTrackIds, baselineTrackIds);
        const hasChanges = diff.addedTrackIds.length > 0 || diff.removedTrackIds.length > 0;

        if (!hasChanges) {
          return null;
        }

        return { diff, trackInfo: nextTrackInfoMap };
      } catch (error) {
        console.error('Failed to check for uncommitted changes', error);
        return null;
      } finally {
        setIsCheckingForChanges(false);
      }
    },
    [fetchAllPlaylistTracks],
  );

  const performAddSong = useCallback(
    async (params: AddSongParams) => {
      const diffResult = await checkForUncommittedChanges(params.playlistId);
      if (diffResult) {
        setPendingDiff(diffResult.diff);
        setPendingAddParams(params);
        setUncommittedPlaylistId(params.playlistId);
        setTrackInfoMap(diffResult.trackInfo);
        setShowUncommittedModal(true);
        return;
      }

      try {
        const data = await addSongAsync(params);
        console.log('Song added successfully! Snapshot:', data.snapshotId);
        resetUncommittedState();
      } catch (error) {
        console.error('Failed to add song:', error);
      }
    },
    [addSongAsync, checkForUncommittedChanges, resetUncommittedState],
  );

  const handleAddSongToPlaylist = useCallback(
    async (targetPlaylistId: string) => {
      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      await performAddSong({
        playlistId: targetPlaylistId,
        uris: [`spotify:track:${track.id}`],
        userId: user.id,
      });
    },
    [performAddSong, track?.id, user?.id],
  );

  const handleRemoveSong = useCallback(() => {
    if (!user?.id) {
      console.error('User ID not available');
      return;
    }

    if (!playlistId) {
      console.error('Playlist ID not available');
      return;
    }

    removeSong(
      {
        playlistId,
        uris: [`spotify:track:${track.id}`],
        userId: user.id,
      },
      {
        onSuccess: (data) => {
          console.log('Song removed successfully! Snapshot:', data.snapshotId, 'Commit:', data.commitId);
          onRemoveSong?.();
        },
        onError: (error) => {
          console.error('Failed to remove song:', error);
        },
      },
    );
  }, [onRemoveSong, playlistId, removeSong, track?.id, user?.id]);

  const handleCommitChanges = useCallback(() => {
    if (!pendingDiff || !user?.id || !uncommittedPlaylistId || !pendingAddParams) {
      console.error('Missing data to commit changes before adding song');
      return;
    }

    const toUri = (trackId: string) => `spotify:track:${trackId}`;

    commitChanges(
      {
        playlistId: uncommittedPlaylistId,
        userId: user.id,
        addedUris: pendingDiff.addedTrackIds.map(toUri),
        removedUris: pendingDiff.removedTrackIds.map(toUri),
      },
      {
        onSuccess: () => {
          performAddSong(pendingAddParams);
        },
        onError: (error) => {
          console.error('Failed to record commit', error);
        },
      },
    );
  }, [
    commitChanges,
    pendingAddParams,
    pendingDiff,
    performAddSong,
    uncommittedPlaylistId,
    user?.id,
  ]);

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray">
            <IconDots size={18} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Track Actions</Menu.Label>
          <Menu trigger="hover" position="right-start" offset={2}>
            <Menu.Target>
              <Menu.Item
                leftSection={<IconPlus size={16} />}
                rightSection={<IconChevronRight size={16} />}
                disabled={isWorking || !user?.id || isLoadingPlaylists}
              >
                {isLoadingPlaylists ? (
                  <>
                    <Loader size="xs" mr={8} /> Loading playlists...
                  </>
                ) : (
                  'Add to playlist'
                )}
              </Menu.Item>
            </Menu.Target>
            <Menu.Dropdown
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {playlistsData?.items.map((playlist) => (
                <Menu.Item
                  key={playlist.id}
                  onClick={() => {
                    void handleAddSongToPlaylist(playlist.id);
                  }}
                  disabled={isWorking}
                >
                  {playlist.name}
                </Menu.Item>
              ))}
              {(!playlistsData || playlistsData.items.length === 0) && (
                <Menu.Item disabled>No playlists available</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
          {canRemove && (
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={handleRemoveSong}
              disabled={isWorking || !user?.id}
            >
              Remove from playlist
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>

      <UncommittedChangesModal
        opened={showUncommittedModal}
        pendingDiff={pendingDiff}
        trackInfoMap={combinedTrackInfoMap}
        isLoadingRemovedDetails={isLoadingRemovedDetails}
        onClose={resetUncommittedState}
        onCommit={handleCommitChanges}
        isCommitPending={isRecordingCommit}
      />
    </>
  );
};
