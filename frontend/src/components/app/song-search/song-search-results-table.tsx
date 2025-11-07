import { Table, Text } from '@mantine/core';
import type { SpotifyTrack } from '@/types/spotify';
import { SongSearchResultRow } from './song-search-result-row';

interface SongSearchResultsTableProps {
  tracks: SpotifyTrack[];
}

export const SongSearchResultsTable = ({ tracks }: SongSearchResultsTableProps) => {
  if (tracks.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No songs found for that query.
      </Text>
    );
  }

  return (
    <Table highlightOnHover verticalSpacing="xs" withRowBorders={false}>
      <Table.Thead>
        <Table.Tr>
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
        {tracks.map((track) => (
          <SongSearchResultRow key={track.id} track={track} />
        ))}
      </Table.Tbody>
    </Table>
  );
};
