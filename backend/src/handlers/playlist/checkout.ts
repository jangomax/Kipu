import { Request, Response } from "express";
import { CheckoutResponse } from "@/models/api/checkout";
import { Commit, Snapshot } from "@/models/db";

export const checkoutHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId, commitId, latestCommitTime } = req.query;

    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }

    if (!commitId && !latestCommitTime) {
      return res.status(400).json({
        error: "Either commitId or latestCommitTime must be provided",
      });
    }

    if (commitId && latestCommitTime) {
      return res.status(400).json({
        error: "Only one of commitId or latestCommitTime can be provided",
      });
    }

    let targetCommit;

    if (commitId) {
      targetCommit = await Commit.findOne({ commitId, playlistId });
      if (!targetCommit) {
        return res.status(404).json({ error: "Commit not found" });
      }
    } else if (latestCommitTime) {
      const timestamp = new Date(latestCommitTime as string);
      if (isNaN(timestamp.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid latestCommitTime format" });
      }

      targetCommit = await Commit.findOne({
        playlistId,
        timestamp: { $lte: timestamp },
      })
        .sort({ timestamp: -1 })
        .limit(1);
    }

    if (!targetCommit) {
      return res.status(404).json({
        error: "No commits found before the specified time",
      });
    }

    const snapshot = await Snapshot.findOne({
      playlistId,
      timestamp: { $lte: targetCommit.timestamp },
    })
      .sort({ timestamp: -1 })
      .limit(1);

    const startTimestamp = snapshot?.timestamp || new Date(0);
    let tracks = snapshot ? [...snapshot.songs] : [];

    const commits = await Commit.find({
      playlistId,
      timestamp: { $gt: startTimestamp, $lte: targetCommit.timestamp },
    }).sort({ timestamp: 1 });

    commits.forEach((commit) => {
      const addedTracks = commit.diff.added?.map((t) => t.trackId) || [];
      tracks = [...tracks, ...addedTracks];

      const removedTracks = commit.diff.removed?.map((t) => t.trackId) || [];
      tracks = tracks.filter((trackId) => !removedTracks.includes(trackId));
    });

    const trackUris = tracks.map((trackId) => `spotify:track:${trackId}`);

    const response: CheckoutResponse = {
      playlistId: playlistId as string,
      commitId: targetCommit.commitId,
      tracks: trackUris,
      timestamp: targetCommit.timestamp.toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in checkoutHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
