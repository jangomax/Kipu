import { Request } from "express";

export const getAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return;
  }
  return authHeader.substring(7);
};
