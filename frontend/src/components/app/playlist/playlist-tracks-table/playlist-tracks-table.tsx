import { Table, Text, Box, Stack, Image, Group } from '@mantine/core';
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PlaylistTrackRow } from './playlist-track-row';
import { PlaylistSongControls } from '../../song-controls/song-controls';

export interface PlaylistTracksTableProps {
  items: SpotifyPlaylistTrackItem[];
  playlistId: string;
}

export const PlaylistTracksTable = ({ items, playlistId }: PlaylistTracksTableProps) => {
  const validItems = items.filter((item) => item.track);

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

            return (
              <Group
                key={`${track.id}-${item.addedAt}`}
                gap="md"
                p="sm"
                style={{
                  borderRadius: '8px',
                  backgroundColor: 'var(--mantine-color-default-hover)',
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
                    <Text size="xs" c="dimmed">
                      No art
                    </Text>
                  </div>
                )}
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} lineClamp={1}>
                    {track.name}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {artists}
                  </Text>
                </Stack>
                <PlaylistSongControls track={track} playlistId={playlistId} />
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
              />
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </>
  );
};
