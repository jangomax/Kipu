import mongoose from "mongoose";

const commitSchema = new mongoose.Schema({
  commitId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  playlistId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  parentId: String,
  diff: {
    required: true,
    type: {
      added: [
        {
          trackId: { type: String, required: true },
        },
      ],
      removed: [
        {
          trackId: { type: String, required: true },
        },
      ],
    },
  },
});

commitSchema.index({ playlistId: 1, timestamp: -1 });

export const Commit = mongoose.model("Commit", commitSchema);
