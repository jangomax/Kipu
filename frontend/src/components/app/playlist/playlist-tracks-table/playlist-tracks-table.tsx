import { Table, Text } from '@mantine/core';
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PlaylistTrackRow } from './playlist-track-row';

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
  );
};
