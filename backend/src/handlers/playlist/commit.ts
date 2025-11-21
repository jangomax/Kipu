import { Request, Response } from "express";
import { CommitRequest, CommitResponse } from "@/models/api/commit";
import { getAccessToken } from "@/util/getAccessToken";
import { Commit } from "@/models/db/commit";
import { maybeCreateSnapshot } from "@/util/snapshotHelper";

export const commitHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { userId, addedUris = [], removedUris = [] } =
      req.body as CommitRequest;

    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (
      !Array.isArray(addedUris) ||
      !Array.isArray(removedUris) ||
      (addedUris.length === 0 && removedUris.length === 0)
    ) {
      return res.status(400).json({
        error:
          "addedUris and removedUris must be arrays, and at least one change is required",
      });
    }

    const now = new Date();
    const commitId = `${userId}|${playlistId}|${now.toISOString()}`;

    const addedTrackIds = addedUris.map((uri) => uri.split(":").pop() || uri);
    const removedTrackIds = removedUris.map((uri) => uri.split(":").pop() || uri);

    const commit = new Commit({
      commitId,
      playlistId,
      userId,
      timestamp: now,
      diff: {
        added: addedTrackIds.map((trackId) => ({ trackId })),
        removed: removedTrackIds.map((trackId) => ({ trackId })),
      },
    });

    await commit.save();
    await maybeCreateSnapshot(playlistId, now);

    const response: CommitResponse = {
      commitId,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in commitHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
