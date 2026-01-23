let sdkPromise: Promise<void> | null = null;

export const loadSpotifyWebPlaybackSdk = (): Promise<void> => {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    if (window.Spotify?.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('spotify-web-playback-sdk');
    if (existingScript) {
      const existingReady = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        existingReady?.();
        resolve();
      };
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve();

    const script = document.createElement('script');
    script.id = 'spotify-web-playback-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Spotify Web Playback SDK'));
    document.body.appendChild(script);
  });

  return sdkPromise;
};
