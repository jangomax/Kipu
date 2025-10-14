import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

/**
 * Generates a random string for the code_verifier
 */
function generateCodeVerifier(length = 64): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

/**
 * Hashes the verifier to create a code_challenge
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Redirects user to Spotify login page using PKCE
 * Frontend will store the code_verifier in localStorage/sessionStorage.
 */
router.get("/login", (req: Request, res: Response) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const scope = [
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
  ].join(" ");

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // save verifier to session cookie (for demo—frontend can handle this too)
  res.cookie("code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 min
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(authUrl);
});

export default router;
