import { Router } from "express";
import { addSongHandler } from "@/handlers/playlist";

const router = Router();

router.post("/playlists/:playlistId/tracks", addSongHandler);

export default router;
