import type { Request, Response } from "express";
import { signAuthToken } from "../utils/jwt";
import { setAuthCookie } from "../utils/cookies";
import { env, isProduction } from "../config/env";

export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.redirect(`${env.WEB_APP_URL}/login?error=oauth_failed`);
    return;
  }

  const token = signAuthToken(user._id.toString());
  setAuthCookie(res, token);

  const destination = isProduction
    ? `${env.WEB_APP_URL}/login?oauth=success`
    : `${env.WEB_APP_URL}/feed`;
  res.redirect(destination);
};
