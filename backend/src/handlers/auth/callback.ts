import { Request, Response } from "express";

/**
 * Receives authorization code and code_verifier from frontend
 * and exchanges them for Spotify access tokens
 */
export const callbackHandler = async (req: Request, res: Response) => {
  const { code, code_verifier } = req.body;

  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  if (!code_verifier) {
    return res.status(400).send("Code verifier missing");
  }

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          code_verifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return res.status(500).send("Failed to exchange authorization code");
    }

    const tokenData = await tokenResponse.json();

    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).send("Internal server error");
  }
};
