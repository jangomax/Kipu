import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Group, Image, Paper, Slider, Stack, Text } from '@mantine/core';
import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
} from '@tabler/icons-react';
import { IconPlayerPauseFilled } from '@tabler/icons-react';
import { IconX } from '@tabler/icons-react';
import { SPOTIFY_API_BASE_URL } from '@/util/constants';
import { getValidAccessToken } from '@/util/auth';
import { loadSpotifyWebPlaybackSdk } from '@/util/spotify-web-playback';
import { setSpotifyActivateElement, setSpotifyDeviceId } from '@/util/spotify-player-store';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface SpotifyPlayerProps {
  onClose?: () => void;
}

export const SpotifyPlayer = ({ onClose }: SpotifyPlayerProps) => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastPositionRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const transferPlayback = async (targetDeviceId: string) => {
      const token = await getValidAccessToken();
      if (!token) {
        return;
      }

      await fetch(`${SPOTIFY_API_BASE_URL}/me/player`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [targetDeviceId], play: false }),
      });
    };

    const setupPlayer = async () => {
      try {
        await loadSpotifyWebPlaybackSdk();

        const player = new window.Spotify!.Player({
          name: 'Kipu Web Player',
          getOAuthToken: async (cb) => {
            const token = await getValidAccessToken();
            if (token) {
              cb(token);
            }
          },
          volume: 0.5,
        });

        playerRef.current = player;
        setSpotifyActivateElement(async () => {
          if (player.activateElement) {
            await player.activateElement();
          }
        });

        player.addListener('ready', ({ device_id }) => {
          if (!isMounted) {
            return;
          }
          console.log('[SpotifyPlayer] ready', { deviceId: device_id });
          setDeviceId(device_id);
          setSpotifyDeviceId(device_id);
          setIsReady(true);
          transferPlayback(device_id).catch((err) => {
            console.error('Failed to transfer playback:', err);
          });
        });

        player.addListener('not_ready', ({ device_id }) => {
          if (!isMounted) {
            return;
          }
          console.warn('[SpotifyPlayer] not_ready', { deviceId: device_id });
          setDeviceId(null);
          setSpotifyDeviceId(null);
          setIsReady(false);
        });

        player.addListener('player_state_changed', (state) => {
          if (!state || !isMounted) {
            return;
          }
          console.log('[SpotifyPlayer] state_changed', {
            track: state.track_window.current_track?.name,
            paused: state.paused,
            position: state.position,
            duration: state.duration,
          });
          setCurrentTrack(state.track_window.current_track);
          setIsPaused(state.paused);
          setPosition(state.position);
          setDuration(state.duration);
          lastPositionRef.current = state.position;
          lastUpdateRef.current = performance.now();
        });

        player.addListener('initialization_error', ({ message }) => {
          if (isMounted) {
            console.error('[SpotifyPlayer] initialization_error', message);
            setError(message);
          }
        });
        player.addListener('authentication_error', ({ message }) => {
          if (isMounted) {
            console.error('[SpotifyPlayer] authentication_error', message);
            setError(message);
          }
        });
        player.addListener('account_error', ({ message }) => {
          if (isMounted) {
            console.error('[SpotifyPlayer] account_error', message);
            setError(message);
          }
        });
        player.addListener('playback_error', ({ message }) => {
          if (isMounted) {
            console.error('[SpotifyPlayer] playback_error', message);
            setError(message);
          }
        });

        const connected = await player.connect();
        if (!connected && isMounted) {
          console.error('[SpotifyPlayer] connect returned false');
          setError('Failed to connect to Spotify Web Player.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Spotify Web Player.');
        }
      }
    };

    setupPlayer();

    return () => {
      isMounted = false;
      setSpotifyDeviceId(null);
      setSpotifyActivateElement(null);
      playerRef.current?.disconnect();
    };
  }, []);

  const handleTogglePlay = () => {
    playerRef.current
      ?.togglePlay()
      .catch((err: unknown) => console.error('Toggle play failed:', err));
  };

  const handlePrev = () => {
    playerRef.current
      ?.previousTrack()
      .catch((err: unknown) => console.error('Previous track failed:', err));
  };

  const handleNext = () => {
    playerRef.current
      ?.nextTrack()
      .catch((err: unknown) => console.error('Next track failed:', err));
  };

  const handleSeek = (value: number) => {
    setPosition(value);
    lastPositionRef.current = value;
    lastUpdateRef.current = performance.now();
    playerRef.current
      ?.seek(value)
      .catch((err: unknown) => console.error('Seek failed:', err));
  };

  useEffect(() => {
    if (isPaused || duration === 0) {
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = now - lastUpdateRef.current;
      const nextPosition = Math.min(lastPositionRef.current + elapsed, duration);
      setPosition(nextPosition);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, duration]);

  const albumArt = currentTrack?.album.images?.[0]?.url;
  const trackTitle = currentTrack?.name ?? 'No track playing';
  const trackArtists = currentTrack?.artists?.map((artist) => artist.name).join(', ') ?? ' ';

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}
    >
      {onClose && (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onClose}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
        >
          <IconX size={14} />
        </ActionIcon>
      )}
      <Stack gap="xs">
        {/* Desktop layout */}
        <Group
          justify="space-between"
          wrap="nowrap"
          align="center"
          style={{ position: 'relative' }}
          visibleFrom="sm"
        >
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0, maxWidth: '45%' }}>
            {albumArt ? (
              <Image src={albumArt} alt={trackTitle} w={48} h={48} radius="md" />
            ) : (
              <Paper withBorder radius="md" w={48} h={48} />
            )}
            <div style={{ minWidth: 0 }}>
              <Text fw={600} lineClamp={1} style={{ maxWidth: 220 }}>
                {trackTitle}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 220 }}>
                {trackArtists}
              </Text>
              {!isReady && (
                <Text size="xs" c="dimmed">
                  Connecting to Spotify Web Player...
                </Text>
              )}
            </div>
          </Group>

          <Group
            gap={6}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <ActionIcon variant="subtle" color="gray" onClick={handlePrev} disabled={!deviceId}>
              <IconPlayerSkipBackFilled size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={handleTogglePlay}
              disabled={!deviceId}
            >
              {isPaused ? <IconPlayerPlayFilled size={20} /> : <IconPlayerPauseFilled size={20} />}
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" onClick={handleNext} disabled={!deviceId}>
              <IconPlayerSkipForwardFilled size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Mobile layout */}
        <Stack gap="xs" hiddenFrom="sm">
          <Group gap="sm" wrap="nowrap" align="center">
            {albumArt ? (
              <Image src={albumArt} alt={trackTitle} w={56} h={56} radius="md" />
            ) : (
              <Paper withBorder radius="md" w={56} h={56} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text fw={600} lineClamp={1}>
                {trackTitle}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {trackArtists}
              </Text>
              {!isReady && (
                <Text size="xs" c="dimmed">
                  Connecting to Spotify Web Player...
                </Text>
              )}
            </div>
          </Group>
          <Group gap="md" justify="center">
            <ActionIcon variant="subtle" color="gray" onClick={handlePrev} disabled={!deviceId}>
              <IconPlayerSkipBackFilled size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={handleTogglePlay}
              disabled={!deviceId}
            >
              {isPaused ? <IconPlayerPlayFilled size={22} /> : <IconPlayerPauseFilled size={22} />}
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" onClick={handleNext} disabled={!deviceId}>
              <IconPlayerSkipForwardFilled size={20} />
            </ActionIcon>
          </Group>
        </Stack>

        <Group gap="xs" align="center">
          <Text size="xs" c="dimmed" style={{ width: 32 }}>
            {formatTime(position)}
          </Text>
          <Slider
            flex={1}
            min={0}
            max={duration || 0}
            value={position}
            onChange={setPosition}
            onChangeEnd={handleSeek}
            disabled={!deviceId || duration === 0}
            size="xs"
            label={null}
            showLabelOnHover={false}
          />
          <Text size="xs" c="dimmed" style={{ width: 32, textAlign: 'right' }}>
            {formatTime(duration)}
          </Text>
        </Group>



        {error && (
          <Text size="xs" c="red">
            {error}
          </Text>
        )}
      </Stack>
    </Paper>
  );
};
