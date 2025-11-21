import { Request, Response } from "express";
import { KeptCommit } from "@/models/db";
import {
  GetKeptCommitsResponse,
  KeptCommitInfo,
} from "@/models/api/getKeptCommits";

export const getKeptCommitsHandler = async (req: Request, res: Response) => {
  try {
    const { userId, playlistId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }

    const query: any = {
      userId: userId as string,
    };

    if (playlistId) {
      query.playlistId = playlistId as string;
    }

    const keptCommits = await KeptCommit.find(query).sort({ keptAt: -1 });

    const keptCommitsInfo: KeptCommitInfo[] = keptCommits.map((kc) => ({
      keptCommitId: kc.keptCommitId,
      commitId: kc.commitId,
      spotifyPlaylistId: kc.spotifyPlaylistId,
      playlistName: kc.playlistName,
      keptAt: kc.keptAt.toISOString(),
    }));

    const response: GetKeptCommitsResponse = {
      keptCommits: keptCommitsInfo,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in getKeptCommitsHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
