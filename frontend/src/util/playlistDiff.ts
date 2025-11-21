import type { SpotifyTrack } from '@/types/spotify';

export interface PendingDiff {
  addedTrackIds: string[];
  removedTrackIds: string[];
}

const buildCountMap = (ids: string[]) => {
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  return counts;
};

export const computeDiff = (current: string[], baseline: string[]): PendingDiff => {
  const currentCounts = buildCountMap(current);
  const baselineCounts = buildCountMap(baseline);

  const addedTrackIds: string[] = [];
  const removedTrackIds: string[] = [];

  currentCounts.forEach((count, id) => {
    const delta = count - (baselineCounts.get(id) || 0);
    if (delta > 0) {
      for (let i = 0; i < delta; i += 1) {
        addedTrackIds.push(id);
      }
    }
  });

  baselineCounts.forEach((count, id) => {
    const delta = count - (currentCounts.get(id) || 0);
    if (delta > 0) {
      for (let i = 0; i < delta; i += 1) {
        removedTrackIds.push(id);
      }
    }
  });

  return { addedTrackIds, removedTrackIds };
};

export const summarizeDiff = (
  ids: string[],
  trackInfoMap: Map<string, SpotifyTrack | undefined>,
) => {
  const counts = buildCountMap(ids);
  return Array.from(counts.entries()).map(([trackId, count]) => {
    const info = trackInfoMap.get(trackId);
    const artists = info?.artists?.map((artist) => artist.name).join(', ');
    const label = info?.name ? `${info.name}${artists ? ` — ${artists}` : ''}` : trackId;
    return { trackId, count, label };
  });
};
