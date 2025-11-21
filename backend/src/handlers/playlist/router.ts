import { Router } from "express";
import {
  addSongHandler,
  removeSongHandler,
  checkoutHandler,
  getCommitsHandler,
  commitHandler,
  keepCommitHandler,
  unkeepCommitHandler,
  getKeptCommitsHandler,
} from "@/handlers/playlist";

const router = Router();

router.post("/playlists/:playlistId/tracks", addSongHandler);
router.delete("/playlists/:playlistId/tracks", removeSongHandler);
router.get("/playlists/:playlistId/checkout", checkoutHandler);
router.get("/playlists/:playlistId/commits", getCommitsHandler);
router.post("/playlists/:playlistId/commit", commitHandler);
router.post("/playlists/:playlistId/commits/:commitId/keep", keepCommitHandler);
router.delete(
  "/playlists/:playlistId/commits/:commitId/keep",
  unkeepCommitHandler
);

router.get("/kept", getKeptCommitsHandler);

export default router;
