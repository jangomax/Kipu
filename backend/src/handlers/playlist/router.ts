import { Router } from "express";
import { addSongHandler, removeSongHandler } from "@/handlers/playlist";

const router = Router();

router.post("/playlists/:playlistId/tracks", addSongHandler);
router.delete("/playlists/:playlistId/tracks", removeSongHandler);

export default router;
