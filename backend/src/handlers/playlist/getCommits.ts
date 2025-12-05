import { Request, Response } from "express";
import { GetCommitsResponse } from "@/models/api/getCommits";
import { Commit } from "@/models/db";
import { getAccessToken } from "@/util/getAccessToken";
import { spotifyGet } from "@/util/requestHelper";
import { maybeCreateSnapshot } from "@/util/snapshotHelper";

export const getCommitsHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;

    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }

    let commits = await Commit.find({ playlistId })
      .sort({ timestamp: -1 })
      .select("commitId timestamp userId parentId diff");

    if (!commits.length) {
      const accessToken = getAccessToken(req);
      if (!accessToken) {
        return res
          .status(401)
          .json({ error: "Missing or invalid authorization header" });
      }

      const spotifyUser = await spotifyGet<{ id: string }>("/me", accessToken);

      const trackIds: string[] = [];
      const limit = 100;
      let offset = 0;
      let hasNext = true;

      while (hasNext) {
        const page = await spotifyGet<{
          items: { track?: { id?: string } | null }[];
          next?: string | null;
        }>(
          `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
          accessToken
        );

        page.items.forEach((item) => {
          const id = item.track?.id;
          if (id) {
            trackIds.push(id);
          }
        });

        if (page.next) {
          const url = new URL(page.next);
          const nextOffset = url.searchParams.get("offset");
          offset = nextOffset ? parseInt(nextOffset, 10) : offset + limit;
        } else {
          hasNext = false;
        }
      }

      const now = new Date();
      const commitId = `${spotifyUser.id}|${playlistId}|${now.toISOString()}`;

      const initialCommit = new Commit({
        commitId,
        playlistId,
        userId: spotifyUser.id,
        timestamp: now,
        diff: {
          added: trackIds.map((trackId) => ({ trackId })),
          removed: [],
        },
      });

      await initialCommit.save();
      await maybeCreateSnapshot(playlistId, now);

      commits = await Commit.find({ playlistId })
        .sort({ timestamp: -1 })
        .select("commitId timestamp userId parentId diff");
    }

    const response: GetCommitsResponse = {
      playlistId,
      commits: commits.map((commit) => ({
        commitId: commit.commitId,
        timestamp: commit.timestamp,
        userId: commit.userId,
        parentId: commit.parentId ?? undefined,
        diff: {
          added: commit.diff?.added || [],
          removed: commit.diff?.removed || [],
        },
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in getCommitsHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
