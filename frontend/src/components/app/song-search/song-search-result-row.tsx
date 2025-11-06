import { Image, Stack, Table, Text } from '@mantine/core';
import type { SpotifyTrack } from '@/types/spotify';
import { PlaylistSongControls } from '@/components/app/song-controls';

const formatDuration = (durationMs?: number) => {
  if (!durationMs || Number.isNaN(durationMs)) {
    return '—';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface SongSearchResultRowProps {
  track: SpotifyTrack;
}

export const SongSearchResultRow = ({ track }: SongSearchResultRowProps) => {
  const trackImage = track.album.images?.[0]?.url;
  const artists = track.artists.map((artist) => artist.name).join(', ');

  return (
    <Table.Tr>
      <Table.Td width={70}>
        {trackImage ? (
          <Image src={trackImage} alt={track.name} w={50} h={50} radius="sm" />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
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
      </Table.Td>
      <Table.Td>
        <Stack gap={4}>
          <Text fw={600}>{track.name}</Text>
          <Text size="sm" c="dimmed">
            {artists}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{track.album.name}</Text>
      </Table.Td>
      <Table.Td width={90}>
        <Text size="sm" c="dimmed">
          {formatDuration(track.durationMs)}
        </Text>
      </Table.Td>
      <Table.Td width={60}>
        <PlaylistSongControls track={track} />
      </Table.Td>
    </Table.Tr>
  );
};
