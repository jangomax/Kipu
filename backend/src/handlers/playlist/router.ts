import { Router } from "express";
import {
  addSongHandler,
  removeSongHandler,
  checkoutHandler,
} from "@/handlers/playlist";

const router = Router();

router.post("/playlists/:playlistId/tracks", addSongHandler);
router.delete("/playlists/:playlistId/tracks", removeSongHandler);
router.get("/playlists/:playlistId/checkout", checkoutHandler);

export default router;
