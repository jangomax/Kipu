import { ActionIcon, Table, Text, Box, Stack, Image, Group } from '@mantine/core';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { useState } from 'react';
import type { SpotifyTrack } from '@/types/spotify';
import { SongSearchResultRow } from './song-search-result-row';
import { PlaylistSongControls } from '../song-controls/song-controls';
import { playTrackOnWebPlayer } from '@/util/spotify-playback';

interface SongSearchResultsTableProps {
  tracks: SpotifyTrack[];
}

export const SongSearchResultsTable = ({ tracks }: SongSearchResultsTableProps) => {
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  const handlePlay = async (trackId: string) => {
    setIsPlayingId(trackId);
    try {
      await playTrackOnWebPlayer(`spotify:track:${trackId}`);
    } finally {
      setIsPlayingId(null);
    }
  };

  if (tracks.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No songs found for that query.
      </Text>
    );
  }

  return (
    <>
      {/* Mobile  */}
      <Box hiddenFrom="sm">
        <Stack gap="xs">
          {tracks.map((track) => {
            const trackImage = track.album.images?.[0]?.url;
            const artists = track.artists.map((artist) => artist.name).join(', ');

            return (
              <Group
                key={track.id}
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
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  onClick={() => handlePlay(track.id)}
                  loading={isPlayingId === track.id}
                  style={{ width: 32, height: 32 }}
                >
                  <IconPlayerPlayFilled size={16} />
                </ActionIcon>
                <PlaylistSongControls track={track} />
              </Group>
            );
          })}
        </Stack>
      </Box>

      {/* Desktop  */}
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
            {tracks.map((track, index) => (
              <SongSearchResultRow key={track.id} track={track} index={index} />
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </>
  );
};
