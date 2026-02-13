import { ActionIcon, Table, Text, Box, Stack, Image, Group } from '@mantine/core';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { useState } from 'react';
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PlaylistTrackRow } from './playlist-track-row';
import { PlaylistSongControls } from '../../song-controls/song-controls';
import { playTrackOnWebPlayer } from '@/util/spotify-playback';

export interface PlaylistTrackDisplayItem extends SpotifyPlaylistTrackItem {
  diffStatus?: 'added' | 'removed' | 'unchanged';
}

export interface PlaylistTracksTableProps {
  items: PlaylistTrackDisplayItem[];
  playlistId: string;
  showSongControls?: boolean;
}

export const PlaylistTracksTable = ({
  items,
  playlistId,
  showSongControls = true,
}: PlaylistTracksTableProps) => {
  const validItems = items.filter((item) => item.track);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const queueUris = validItems.map((item) => `spotify:track:${item.track!.id}`);

  const handlePlay = async (trackId: string) => {
    const offset = validItems.findIndex((item) => item.track?.id === trackId);
    setIsPlayingId(trackId);
    try {
      await playTrackOnWebPlayer({
        trackUri: `spotify:track:${trackId}`,
        uris: queueUris,
        offset: offset >= 0 ? offset : undefined,
      });
    } finally {
      setIsPlayingId(null);
    }
  };

  if (validItems.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        This playlist does not have any tracks yet.
      </Text>
    );
  }

  return (
    <>
      {/* Desktop */}
      <Box hiddenFrom="sm">
        <Stack gap="xs">
          {validItems.map((item) => {
            const track = item.track!;
            const trackImage = track.album.images?.[0]?.url;
            const artists = track.artists.map((artist) => artist.name).join(', ');
            const isDiffRow = item.diffStatus === 'added' || item.diffStatus === 'removed';
            const primaryColor = isDiffRow ? '#ffffff' : undefined;
            const secondaryColor = isDiffRow ? 'rgba(255, 255, 255, 0.88)' : 'dimmed';

            return (
              <Group
                key={`${track.id}-${item.addedAt}`}
                gap="md"
                p="sm"
                style={{
                  borderRadius: '8px',
                  backgroundColor:
                    item.diffStatus === 'added'
                      ? 'var(--mantine-color-green-6)'
                      : item.diffStatus === 'removed'
                        ? 'var(--mantine-color-red-6)'
                        : 'var(--mantine-color-default-hover)',
                  borderLeft:
                    item.diffStatus === 'added'
                      ? '4px solid var(--mantine-color-green-9)'
                      : item.diffStatus === 'removed'
                        ? '4px solid var(--mantine-color-red-9)'
                        : '4px solid transparent',
                }}
              >
                {trackImage ? (
                  <Image src={trackImage} alt={track.name} w={60} h={60} radius="sm" />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      border: '1px solid var(--mantine-color-dark-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text size="xs" c={secondaryColor}>
                      No art
                    </Text>
                  </div>
                )}
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} lineClamp={1} c={primaryColor}>
                    {track.name}
                  </Text>
                  <Text size="sm" c={secondaryColor} lineClamp={1}>
                    {artists}
                  </Text>
                </Stack>
                <ActionIcon
                  variant="subtle"
                  color={isDiffRow ? 'light' : 'gray'}
                  radius="xl"
                  onClick={() => handlePlay(track.id)}
                  loading={isPlayingId === track.id}
                  style={{ width: 32, height: 32 }}
                >
                  <IconPlayerPlayFilled size={16} />
                </ActionIcon>
                {showSongControls && <PlaylistSongControls track={track} playlistId={playlistId} />}
              </Group>
            );
          })}
        </Stack>
      </Box>

      {/* Mobile  */}
      <Box visibleFrom="sm">
        <Table highlightOnHover verticalSpacing="xs" withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th></Table.Th>
              <Table.Th>Track</Table.Th>
              <Table.Th>Album</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody
            style={{
              borderTop: '1px solid var(--mantine-color-gray-3)',
            }}
          >
            {validItems.map((item, index) => (
              <PlaylistTrackRow
                key={`${item.track!.id}-${item.addedAt}`}
                item={item}
                playlistId={playlistId}
                index={index}
                queueUris={queueUris}
                diffStatus={item.diffStatus}
                showSongControls={showSongControls}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </>
  );
};
