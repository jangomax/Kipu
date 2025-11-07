import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true },
  playlistId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  songs: [{ type: String }],
  commitsSinceSnapshot: { type: Number, default: 0 },
});

snapshotSchema.index({ playlistId: 1, timestamp: -1 });

export const Snapshot = mongoose.model("Snapshot", snapshotSchema);
