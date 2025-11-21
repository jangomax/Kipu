import { Request, Response } from "express";
import axios from "axios";
import { Commit, KeptCommit, Snapshot } from "@/models/db";
import { spotifyPost, spotifyGet, spotifyPut } from "@/util/requestHelper";
import { getAccessToken } from "@/util/getAccessToken";
import { KeepCommitResponse } from "@/models/api/keepCommit";

export const keepCommitHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId, commitId } = req.params;
    const { userId } = req.body;

    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const targetCommit = await Commit.findOne({ commitId, playlistId });
    if (!targetCommit) {
      return res.status(404).json({ error: "Commit not found" });
    }

    const existingKept = await KeptCommit.findOne({ commitId, userId });
    if (existingKept) {
      return res.status(409).json({
        error: "Commit already kept by this user",
        keptCommit: existingKept,
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

    const originalPlaylist = await spotifyGet<{ name: string }>(
      `/playlists/${playlistId}`,
      accessToken
    );

    const spotifyUser = await spotifyGet<{ id: string }>(`/me`, accessToken);

    const timestamp = new Date(targetCommit.timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const newPlaylistName = `${originalPlaylist.name} @ ${timestamp}`;

    const newPlaylist = await spotifyPost<{ id: string }>(
      `/users/${spotifyUser.id}/playlists`,
      accessToken,
      {
        name: newPlaylistName,
        description: "Kipu Archive",
        public: false,
      }
    );

    const trackUris = tracks.map((trackId) => `spotify:track:${trackId}`);

    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      await spotifyPost(`/playlists/${newPlaylist.id}/tracks`, accessToken, {
        uris: batch,
      });
    }

    const keptCommitId = `${userId}|${commitId}|${new Date().toISOString()}`;
    const keptCommit = new KeptCommit({
      keptCommitId,
      commitId,
      playlistId,
      userId,
      spotifyPlaylistId: newPlaylist.id,
      playlistName: newPlaylistName,
      keptAt: new Date(),
    });

    await keptCommit.save();

    const response: KeepCommitResponse = {
      keptCommitId,
      spotifyPlaylistId: newPlaylist.id,
      playlistName: newPlaylistName,
      trackCount: tracks.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in keepCommitHandler:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const details = error.response?.data || error.message;
      return res.status(status).json({
        error: "Failed to keep commit",
        details,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
