import { Commit, Snapshot } from "@/models/db";

const SNAPSHOT_INTERVAL = 10;

export const maybeCreateSnapshot = async (
  playlistId: string,
  latestCommitTimestamp: Date
): Promise<void> => {
  try {
    const latestSnapshot = await Snapshot.findOne({ playlistId })
      .sort({ timestamp: -1 })
      .limit(1);

    const commitsSinceSnapshot =
      (latestSnapshot?.commitsSinceSnapshot || 0) + 1;

    if (latestSnapshot) {
      await Snapshot.updateOne(
        { _id: latestSnapshot._id },
        { commitsSinceSnapshot }
      );
    }

    if (!latestSnapshot || commitsSinceSnapshot >= SNAPSHOT_INTERVAL) {
      await createSnapshot(playlistId, latestCommitTimestamp);
    }
  } catch (error) {
    console.error("Error in maybeCreateSnapshot:", error);
  }
};

export const createSnapshot = async (
  playlistId: string,
  timestamp: Date
): Promise<void> => {
  const previousSnapshot = await Snapshot.findOne({
    playlistId,
    timestamp: { $lt: timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(1);

  const startTimestamp = previousSnapshot?.timestamp || new Date(0);
  let tracks = previousSnapshot ? [...previousSnapshot.songs] : [];

  const commits = await Commit.find({
    playlistId,
    timestamp: { $gt: startTimestamp, $lte: timestamp },
  }).sort({ timestamp: 1 });

  commits.forEach((commit) => {
    const addedTracks = commit.diff.added?.map((t) => t.trackId) || [];
    tracks = [...tracks, ...addedTracks];

    const removedTracks = commit.diff.removed?.map((t) => t.trackId) || [];
    tracks = tracks.filter((trackId) => !removedTracks.includes(trackId));
  });

  const snapshotId = `${playlistId}|${timestamp.toISOString()}`;
  const snapshot = new Snapshot({
    snapshotId,
    playlistId,
    timestamp,
    songs: tracks,
    commitsSinceSnapshot: 0,
  });

  await snapshot.save();
  console.log(`Created snapshot ${snapshotId} with ${tracks.length} tracks`);
};
