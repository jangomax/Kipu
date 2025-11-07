import { Request, Response } from "express";
import { GetCommitsResponse } from "@/models/api/getCommits";
import { Commit } from "@/models/db";

export const getCommitsHandler = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;

    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }

    const commits = await Commit.find({ playlistId })
      .sort({ timestamp: -1 })
      .select("commitId timestamp userId parentId");

    const response: GetCommitsResponse = {
      playlistId,
      commits: commits.map((commit) => ({
        commitId: commit.commitId,
        timestamp: commit.timestamp,
        userId: commit.userId,
        parentId: commit.parentId ?? undefined,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in getCommitsHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
