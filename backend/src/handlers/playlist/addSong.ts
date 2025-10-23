import { Request, Response } from "express";
import axios from "axios";
import { AddSongRequest, AddSongResponse } from "@/models/api/addSong";
import { Commit } from "@/models/db/commit";
import { spotifyPost } from "@/util/requestHelper";
import { getAccessToken } from "@/util/getAccessToken";

export const addSongHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { position, uris, userId } = req.body as AddSongRequest;

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

    if (!!position && position < 0) {
      return res
        .status(400)
        .json({ error: "position must be a non-negative number" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const spotifyData = await spotifyPost<{ snapshot_id: string }>(
      `/playlists/${playlistId}/tracks`,
      accessToken,
      {
        uris,
        position,
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
        added: trackIds.map((trackId) => ({ trackId })),
        removed: [],
      },
    });

    await commit.save();

    const response: AddSongResponse = {
      commitId: commitId,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in addSongHandler:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const details = error.response?.data || error.message;
      return res.status(status).json({
        error: "Failed to add tracks to Spotify playlist",
        details,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
