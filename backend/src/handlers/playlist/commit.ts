import { Request, Response } from "express";
import { CommitRequest, CommitResponse } from "@/models/api/commit";
import { getAccessToken } from "@/util/getAccessToken";
import { Commit } from "@/models/db/commit";
import { maybeCreateSnapshot } from "@/util/snapshotHelper";
import { spotifyGet } from "@/util/requestHelper";

interface SpotifyPlaylistTracksResponse {
  items: Array<{
    track: {
      id: string;
      uri: string;
    } | null;
  }>;
  next: string | null;
  total: number;
}

async function fetchAllPlaylistTracks(
  playlistId: string,
  accessToken: string
): Promise<string[]> {
  const trackIds: string[] = [];
  let nextPath: string | null = `/playlists/${playlistId}/tracks?limit=100`;

  while (nextPath) {
    const data: SpotifyPlaylistTracksResponse =
      await spotifyGet<SpotifyPlaylistTracksResponse>(nextPath, accessToken);

    for (const item of data.items) {
      if (item.track?.id) {
        trackIds.push(item.track.id);
      }
    }

    if (data.next) {
      // Extract the path from the full URL
      const parsed: URL = new URL(data.next);
      nextPath = parsed.pathname.replace("/v1", "") + parsed.search;
    } else {
      nextPath = null;
    }
  }

  return trackIds;
}

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

    if (!Array.isArray(addedUris) || !Array.isArray(removedUris)) {
      return res.status(400).json({
        error: "addedUris and removedUris must be arrays",
      });
    }

    let addedTrackIds: string[];
    let removedTrackIds: string[];

    // If no changes passed, this is an initial check-in
    // Fetch current tracks from Spotify and treat them all as "added"
    if (addedUris.length === 0 && removedUris.length === 0) {
      addedTrackIds = await fetchAllPlaylistTracks(playlistId, accessToken);
      removedTrackIds = [];

      if (addedTrackIds.length === 0) {
        return res.status(400).json({
          error: "Cannot check in an empty playlist",
        });
      }
    } else {
      addedTrackIds = addedUris.map((uri) => uri.split(":").pop() || uri);
      removedTrackIds = removedUris.map((uri) => uri.split(":").pop() || uri);
    }

    const now = new Date();
    const commitId = `${userId}|${playlistId}|${now.toISOString()}`;

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
