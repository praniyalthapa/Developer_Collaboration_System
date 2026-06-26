import { Router } from "express";
import passport from "passport";
import { env, googleOAuthEnabled } from "../config/env";
import { googleCallback } from "../controllers/oauth.controller";

export const oauthRoutes = Router();

oauthRoutes.get("/auth/google", (req, res, next) => {
  if (!googleOAuthEnabled) {
    res.status(503).json({ message: "Google OAuth is not configured" });
    return;
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

oauthRoutes.get(
  "/auth/google/callback",
  (req, res, next) => {
    if (!googleOAuthEnabled) {
      res.redirect(`${env.WEB_APP_URL}/login`);
      return;
    }
    passport.authenticate("google", {
      failureRedirect: `${env.WEB_APP_URL}/login?error=oauth_failed`,
      session: false,
    })(req, res, next);
  },
  googleCallback,
);
