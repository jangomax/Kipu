import mongoose from "mongoose";

const keptCommitSchema = new mongoose.Schema({
  keptCommitId: {
    type: String,
    required: true,
    unique: true,
  },
  commitId: {
    type: String,
    required: true,
    index: true,
  },
  playlistId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  spotifyPlaylistId: {
    type: String,
    required: true,
  },
  playlistName: {
    type: String,
    required: true,
  },
  keptAt: {
    type: Date,
    default: Date.now,
  },
});

keptCommitSchema.index({ userId: 1, keptAt: -1 });
keptCommitSchema.index({ playlistId: 1, userId: 1 });
keptCommitSchema.index({ commitId: 1, userId: 1 }, { unique: true });

export const KeptCommit = mongoose.model("KeptCommit", keptCommitSchema);
