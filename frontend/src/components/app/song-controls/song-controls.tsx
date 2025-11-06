import { ActionIcon, Loader, Menu } from '@mantine/core';
import { IconChevronRight, IconDots, IconPlus, IconTrash } from '@tabler/icons-react';
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { useAddSong } from '@/hooks/useAddSong';
import { useRemoveSong } from '@/hooks/useRemoveSong';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';

export interface PlaylistSongControlsProps {
  track: SpotifyPlaylistTrackItem['track'];
  playlistId: string;
  onRemoveSong?: () => void;
}

export const PlaylistSongControls = ({ track, playlistId, onRemoveSong }: PlaylistSongControlsProps) => {
  const { data: user } = useSpotifyUser();
  const { data: playlistsData, isLoading: isLoadingPlaylists } = usePlaylists();
  const { mutate: addSong, isPending: isAddPending } = useAddSong();
  const { mutate: removeSong, isPending: isRemovePending } = useRemoveSong();

  if (!track) {
    return null;
  }

  const handleAddSongToPlaylist = (targetPlaylistId: string) => {
    if (!user?.id) {
      console.error('User ID not available');
      return;
    }

    addSong(
      {
        playlistId: targetPlaylistId,
        uris: [`spotify:track:${track.id}`],
        userId: user.id,
      },
      {
        onSuccess: (data) => {
          console.log('Song added successfully! Snapshot:', data.snapshotId);
        },
        onError: (error) => {
          console.error('Failed to add song:', error);
        },
      },
    );
  };

  const handleRemoveSong = () => {
    if (!user?.id) {
      console.error('User ID not available');
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
  };

  return (
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
              disabled={isAddPending || isRemovePending || !user?.id || isLoadingPlaylists}
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
                onClick={() => handleAddSongToPlaylist(playlist.id)}
                disabled={isAddPending || isRemovePending}
              >
                {playlist.name}
              </Menu.Item>
            ))}
            {(!playlistsData || playlistsData.items.length === 0) && (
              <Menu.Item disabled>No playlists available</Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
        <Menu.Item
          leftSection={<IconTrash size={16} />}
          color="red"
          onClick={handleRemoveSong}
          disabled={isAddPending || isRemovePending || !user?.id}
        >
          Remove from playlist
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
