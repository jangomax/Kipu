import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Anchor,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Button,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaylistTracks } from '@/hooks/usePlaylistTracks';
import { useSpotifyUserProfile } from '@/hooks/useSpotifyUserProfile';
import { PlaylistTracksTable } from '@/components/app/playlist/playlist-tracks-table';
import { PlaylistSidebarList } from './playlist-sidebar-list';

interface PlaylistDetailViewProps {
  playlistId: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onSelectPlaylist?: (playlistId: string) => void;
  wrapInContainer?: boolean;
}

export const PlaylistDetailPage = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();

  if (!playlistId) {
    return (
      <Container size="lg" style={{ marginTop: '1rem' }}>
        <Alert color="red" title="Playlist not found">
          Missing playlist identifier.
        </Alert>
      </Container>
    );
  }

  return (
    <PlaylistDetailView
      playlistId={playlistId}
      showBackButton
      onBack={() => navigate("/app")}
      onSelectPlaylist={(id) => {
        if (id !== playlistId) {
          navigate(`/app/playlists/${id}`, { replace: false });
        }
      }}
      wrapInContainer={false}
    />
  );
};

export const PlaylistDetailView = ({
  playlistId,
  showBackButton = false,
  onBack,
  onSelectPlaylist,
  wrapInContainer = true,
}: PlaylistDetailViewProps) => {
  const navigate = useNavigate();
  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    isError: playlistsError,
  } = usePlaylists();

  const {
    data: playlistTracks,
    isLoading: isLoadingTracks,
    isError: tracksError,
  } = usePlaylistTracks(playlistId);

  const playlist = useMemo(
    () => playlists?.items.find((item) => item.id === playlistId),
    [playlists, playlistId],
  );

  const shouldFetchOwnerProfile =
    !!playlist?.owner?.id && !playlist?.owner?.displayName && playlist?.owner?.type === 'user';
  const { data: ownerProfile } = useSpotifyUserProfile(
    shouldFetchOwnerProfile ? playlist?.owner?.id : undefined,
  );
  const ownerName = playlist?.owner.displayName || ownerProfile?.displayName || 'Unknown creator';

  const loading = isLoadingPlaylists || isLoadingTracks;

  if (loading) {
    return (
      <Container size="lg" style={{ marginTop: '2rem' }}>
        <Stack gap="lg" align="center">
          <Loader size="lg" />
          <Text c="dimmed">Loading playlist...</Text>
        </Stack>
      </Container>
    );
  }

  const coverImage = playlist?.images?.[0]?.url;
  const handleSelect = (id: string) => {
    if (id === playlistId) return;
    if (onSelectPlaylist) {
      onSelectPlaylist(id);
    } else {
      navigate(`/app/playlists/${id}`);
    }
  };

  let mainContent: React.ReactNode;

  if (playlistsError || tracksError) {
    mainContent = (
      <Alert color="red" title="Error">
        Unable to load playlist details right now. Please try again.
      </Alert>
    );
  } else if (loading) {
    mainContent = (
      <Stack gap="sm" align="center" justify="center" style={{ minHeight: 240 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading playlist...</Text>
      </Stack>
    );
  } else if (!playlist) {
    mainContent = (
      <Alert color="red" title="Playlist not available">
        We could not locate that playlist. It may have been removed or is not accessible.
      </Alert>
    );
  } else {
    mainContent = (
      <>
        <Group align="flex-start" gap="md" wrap="wrap">
          {coverImage ? (
            <Image src={coverImage} alt={playlist.name} w={200} h={200} radius="md" />
          ) : (
            <Paper
              withBorder
              shadow="sm"
              radius="md"
              style={{
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c="dimmed">No cover</Text>
            </Paper>
          )}

          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <Title order={2}>{playlist.name}</Title>
            {playlist.description && <Text>{playlist.description}</Text>}
            <Text size="sm" c="dimmed">
              {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
            </Text>
            <Text size="sm" c="dimmed">
              By {ownerName}
            </Text>
            {playlist.externalUrls?.spotify && (
              <Anchor href={playlist.externalUrls.spotify} target="_blank" rel="noreferrer">
                View on Spotify
              </Anchor>
            )}
          </Stack>
        </Group>

        <PlaylistTracksTable items={playlistTracks?.items ?? []} playlistId={playlistId} />
      </>
    );
  }

  const content = (
    <Stack
      gap="md"
      style={{
        marginTop: wrapInContainer ? '1.25rem' : 0,
        width: '100%',
        paddingRight: wrapInContainer ? 0 : '1.5rem',
      }}
    >
      {showBackButton && (
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => onBack?.()}
          style={{
            alignSelf: 'flex-start',
            boxShadow: 'var(--mantine-shadow-xs)',
          }}
        >
          Back
        </Button>
      )}

      <Group
        align="flex-start"
        gap="xl"
        wrap="nowrap"
        style={{
          alignItems: 'stretch',
          width: '100%',
          marginInline: 0,
        }}
      >
        <PlaylistSidebarList
          playlists={playlists?.items ?? []}
          currentId={playlistId}
          onSelect={handleSelect}
          loading={isLoadingPlaylists}
          style={{
            top: wrapInContainer
              ? 'calc(var(--app-shell-header-height, 50px) + 16px)'
              : '60px',
          }}
        />

        <Stack
          gap="md"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {mainContent}
        </Stack>
      </Group>
    </Stack>
  );

  if (wrapInContainer) {
    return (
      <Container size="lg" style={{ marginTop: '1.25rem' }}>
        {content}
      </Container>
    );
  }

  return content;
};
