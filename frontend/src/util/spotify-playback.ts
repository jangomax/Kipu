import { SPOTIFY_API_BASE_URL } from './constants';
import { getValidAccessToken } from './auth';
import {
  getSpotifyActivateElement,
  getSpotifyDeviceId,
  setSpotifyDeviceId,
  subscribeSpotifyDeviceId,
} from './spotify-player-store';

const transferPlayback = async (deviceId: string, token: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
  console.log('[SpotifyPlayback] transfer response', { status: response.status });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SpotifyPlayback] transfer failed', { status: response.status, errorText });
  }
};

const fetchDevices = async (token: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/devices`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SpotifyPlayback] devices fetch failed', { status: response.status, errorText });
    return null;
  }
  const data = (await response.json()) as {
    devices?: Array<{ id: string | null; name: string }>;
  };
  console.log('[SpotifyPlayback] devices list', data);
  return data;
};

export const playTrackOnWebPlayer = async (trackUri: string): Promise<void> => {
  sessionStorage.setItem('kipu_player_visible', '1');
  window.dispatchEvent(new CustomEvent('kipu-player-visibility', { detail: { visible: true } }));

  const waitForDeviceId = () =>
    new Promise<string | null>((resolve) => {
      const existing = getSpotifyDeviceId();
      if (existing) {
        resolve(existing);
        return;
      }

      const timeoutId = window.setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);

      const unsubscribe = subscribeSpotifyDeviceId((nextId) => {
        if (nextId) {
          window.clearTimeout(timeoutId);
          unsubscribe();
          resolve(nextId);
        }
      });
    });

  const deviceId = await waitForDeviceId();
  if (!deviceId) {
    throw new Error('Spotify Web Player is still starting. Try again in a moment.');
  }

  const activate = getSpotifyActivateElement();
  if (activate) {
    try {
      await activate();
      console.log('[SpotifyPlayback] activateElement success');
    } catch (error) {
      console.warn('[SpotifyPlayback] activateElement failed', error);
    }
  }

  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Spotify access token missing.');
  }

  const devicesData = await fetchDevices(token);
  const devices = devicesData?.devices ?? [];
  let targetDeviceId = deviceId;
  if (!devices.find((device) => device.id === targetDeviceId)) {
    const webPlayer = devices.find((device) => device.name === 'Kipu Web Player' && device.id);
    if (webPlayer?.id) {
      targetDeviceId = webPlayer.id;
      setSpotifyDeviceId(targetDeviceId);
      console.warn('[SpotifyPlayback] deviceId updated from device list', { targetDeviceId });
    }
  }

  if (!targetDeviceId) {
    throw new Error('Spotify Web Player device not available.');
  }

  const playWithDeviceParam = async () =>
    fetch(`${SPOTIFY_API_BASE_URL}/me/player/play?device_id=${encodeURIComponent(targetDeviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });

  const playWithoutDeviceParam = async () =>
    fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });

  let response = await playWithDeviceParam();
  console.log('[SpotifyPlayback] play response', { status: response.status });

  if (response.status === 404) {
    console.warn('[SpotifyPlayback] device not found, transferring playback', { targetDeviceId });
    await transferPlayback(targetDeviceId, token);
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await playWithoutDeviceParam();
    console.log('[SpotifyPlayback] play retry (no device) response', { status: response.status });

    if (response.status === 404) {
      response = await playWithDeviceParam();
      console.log('[SpotifyPlayback] play retry (with device) response', { status: response.status });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SpotifyPlayback] play failed', { status: response.status, errorText });
    throw new Error(errorText || 'Failed to start playback.');
  }
};
