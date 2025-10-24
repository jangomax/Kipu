import { Request, Response } from "express";
import axios from "axios";
import { Commit } from "@/models/db/commit";
import { spotifyDelete } from "@/util/requestHelper";
import { getAccessToken } from "@/util/getAccessToken";
import { RemoveSongRequest, RemoveSongResponse } from "@/models/api/removeSong";

export const removeSongHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { uris, userId, snapshotId } = req.body as RemoveSongRequest;

    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    if (!uris || !Array.isArray(uris) || uris.length === 0) {
      return res
        .status(400)
        .json({ error: "uris array is required and must not be empty" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const spotifyData = await spotifyDelete<{ snapshot_id: string }>(
      `/playlists/${playlistId}/tracks`,
      accessToken,
      {
        data: {
          tracks: uris.map((u) => ({ uri: u })),
          snapshot_id: snapshotId,
        },
      }
    );

    const trackIds = uris.map((uri) => uri.split(":")[2]);
    const now = new Date();

    const commitId = `${userId}|${playlistId}|${now.toISOString()}`;

    const commit = new Commit({
      commitId: commitId,
      playlistId,
      userId,
      timestamp: now,
      diff: {
        added: [],
        removed: trackIds.map((trackId) => ({ trackId })),
      },
    });

    await commit.save();

    const response: RemoveSongResponse = {
      snapshotId: spotifyData.snapshot_id,
      commitId: commitId,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in removeSongHandler:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const details = error.response?.data || error.message;
      return res.status(status).json({
        error: "Failed to remove tracks to Spotify playlist",
        details,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
