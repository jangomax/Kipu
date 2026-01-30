import { ActionIcon, Center, Image, Stack, Table, Text } from '@mantine/core';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import type { SpotifyPlaylistTrackItem } from '@/types/spotify';
import { PlaylistSongControls } from '../../song-controls/song-controls';
import { playTrackOnWebPlayer } from '@/util/spotify-playback';
import { getSpotifyDeviceId, subscribeSpotifyDeviceId } from '@/util/spotify-player-store';
import { useEffect, useState } from 'react';

const resolveDurationMs = (track: SpotifyPlaylistTrackItem['track']): number | undefined => {
  if (!track) {
    return undefined;
  }

  if (typeof track.durationMs === 'number') {
    return track.durationMs;
  }

  return undefined;
};

const formatDuration = (durationMs?: number) => {
  if (!durationMs || Number.isNaN(durationMs)) {
    return '—';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export interface PlaylistTrackRowProps {
  item: SpotifyPlaylistTrackItem;
  playlistId: string;
  index: number;
  onRemoveSong?: () => void;
  queueUris?: string[];
}

export const PlaylistTrackRow = ({
  item,
  playlistId,
  index,
  onRemoveSong,
  queueUris,
}: PlaylistTrackRowProps) => {
  const track = item.track;

  if (!track) {
    return null;
  }

  const trackImage = track.album.images?.[0]?.url;
  const artists = track.artists.map((artist) => artist.name).join(', ');
  const durationMs = resolveDurationMs(track);
  const [deviceId, setDeviceId] = useState<string | null>(getSpotifyDeviceId());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    return subscribeSpotifyDeviceId((nextId) => {
      setDeviceId(nextId);
    });
  }, []);

  const handlePlay = async () => {
    setPlayError(null);
    setIsPlaying(true);
    try {
      await playTrackOnWebPlayer({
        trackUri: `spotify:track:${track.id}`,
        uris: queueUris,
        offset: index,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to play track.';
      setPlayError(message);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <Table.Tr key={`${track.id}-${item.addedAt}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Table.Td width={50}>
        <Center>
          {isHovered ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              onClick={handlePlay}
              loading={isPlaying}
              style={{
                width: 28,
                height: 28,
              }}
            >
              <IconPlayerPlayFilled size={14} color="var(--mantine-color-gray-5)" />
            </ActionIcon>
          ) : (
            <Text size="sm" c="dimmed" ta="center">
              {index + 1}
            </Text>
          )}
        </Center>
      </Table.Td>
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
          {formatDuration(durationMs)}
        </Text>
      </Table.Td>
      <Table.Td width={60}>
        <PlaylistSongControls track={track} playlistId={playlistId} onRemoveSong={onRemoveSong} />
        {playError && (
          <Text size="xs" c="red">
            {playError}
          </Text>
        )}
      </Table.Td>
    </Table.Tr>
  );
};
