import type { KeyboardEvent } from 'react';
import { Card, Image, Text, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router';
import { SpotifyPlaylist } from '@/types/spotify';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
}

export const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const coverImage = playlist.images?.[0]?.url;
  const navigate = useNavigate();

  const handleOpenPlaylist = () => {
    navigate(`/app/playlists/${playlist.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenPlaylist();
    }
  };

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={handleOpenPlaylist}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <Card.Section>
        {coverImage ? (
          <Image src={coverImage} h={200} w={200} alt={playlist.name} />
        ) : (
          <div
            style={{
              height: 200,
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text c="dimmed">No cover</Text>
          </div>
        )}
      </Card.Section>

      <Group mt="md" mb="xs">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text fw={500} lineClamp={2}>
            {playlist.name}
          </Text>
          <Text size="sm" c="dimmed">
            {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
};
