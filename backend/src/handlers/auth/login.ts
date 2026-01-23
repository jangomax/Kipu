import { Request, Response } from "express";
import crypto from "crypto";

/**
 * Hashes the verifier to create a code_challenge
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Receives code_verifier from frontend and generates Spotify auth URL
 */
export const loginHandler = (req: Request, res: Response) => {
  const { code_verifier } = req.body;

  if (!code_verifier) {
    return res.status(400).send("Code verifier missing");
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const scope = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const codeChallenge = generateCodeChallenge(code_verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  res.json({ auth_url: authUrl });
};
