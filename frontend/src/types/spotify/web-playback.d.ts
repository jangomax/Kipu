export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: typeof Spotify;
  }

  namespace Spotify {
    interface PlayerInit {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }

    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      activateElement?: () => Promise<void>;
      addListener(
        event: 'ready' | 'not_ready',
        cb: (args: { device_id: string }) => void,
      ): boolean;
      addListener(
        event: 'player_state_changed',
        cb: (state: PlaybackState | null) => void,
      ): boolean;
      addListener(
        event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
        cb: (args: { message: string }) => void,
      ): boolean;
      removeListener(event: string, cb?: (...args: unknown[]) => void): boolean;
      getCurrentState(): Promise<PlaybackState | null>;
      togglePlay(): Promise<void>;
      pause(): Promise<void>;
      resume(): Promise<void>;
      seek(position_ms: number): Promise<void>;
      previousTrack(): Promise<void>;
      nextTrack(): Promise<void>;
    }

    interface PlaybackState {
      position: number;
      duration: number;
      paused: boolean;
      track_window: {
        current_track: Track;
        previous_tracks: Track[];
        next_tracks: Track[];
      };
    }

    interface Track {
      id: string;
      name: string;
      duration_ms: number;
      artists: { name: string }[];
      album: { name: string; images: { url: string; height: number; width: number }[] };
    }

    const Player: {
      new (options: PlayerInit): Player;
    };
  }
}
