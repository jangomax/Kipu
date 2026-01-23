type DeviceListener = (deviceId: string | null) => void;
type ActivateListener = (activate: (() => Promise<void>) | null) => void;

let spotifyDeviceId: string | null = null;
const listeners = new Set<DeviceListener>();
let activateElement: (() => Promise<void>) | null = null;
const activateListeners = new Set<ActivateListener>();

export const setSpotifyDeviceId = (deviceId: string | null) => {
  spotifyDeviceId = deviceId;
  listeners.forEach((listener) => listener(deviceId));
};

export const getSpotifyDeviceId = (): string | null => spotifyDeviceId;

export const subscribeSpotifyDeviceId = (listener: DeviceListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setSpotifyActivateElement = (activate: (() => Promise<void>) | null) => {
  activateElement = activate;
  activateListeners.forEach((listener) => listener(activate));
};

export const getSpotifyActivateElement = (): (() => Promise<void>) | null => activateElement;

export const subscribeSpotifyActivateElement = (listener: ActivateListener): (() => void) => {
  activateListeners.add(listener);
  return () => activateListeners.delete(listener);
};
