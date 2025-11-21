import { Request, Response } from "express";
import axios from "axios";
import { KeptCommit } from "@/models/db";
import { spotifyDelete } from "@/util/requestHelper";
import { getAccessToken } from "@/util/getAccessToken";
import {
  UnkeepCommitRequest,
  UnkeepCommitResponse,
} from "@/models/api/unkeepCommit";

export const unkeepCommitHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId, commitId } = req.params;
    const { userId, deleteSpotifyPlaylist } = req.body as UnkeepCommitRequest;

    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const keptCommit = await KeptCommit.findOne({ commitId, userId });
    if (!keptCommit) {
      return res.status(404).json({ error: "Kept commit not found" });
    }

    if (deleteSpotifyPlaylist) {
      try {
        await spotifyDelete(
          `/playlists/${keptCommit.spotifyPlaylistId}/followers`,
          accessToken
        );
      } catch (error) {
        console.error("Error deleting Spotify playlist:", error);
      }
    }

    await KeptCommit.deleteOne({ _id: keptCommit._id });

    const response: UnkeepCommitResponse = {
      success: true,
      deletedSpotifyPlaylist: deleteSpotifyPlaylist || false,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in unkeepCommitHandler:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const details = error.response?.data || error.message;
      return res.status(status).json({
        error: "Failed to unkeep commit",
        details,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
