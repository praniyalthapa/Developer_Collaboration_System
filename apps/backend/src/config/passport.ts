import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import { User } from "../models/user.model";
import { env, googleOAuthEnabled } from "./env";
import { logger } from "../utils/logger";

export const configurePassport = (): void => {
  if (!googleOAuthEnabled) {
    logger.info("Google OAuth disabled (credentials not configured)");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL:
          env.GOOGLE_CALLBACK_URL ??
          `${env.BACKEND_BASE_URL}/api/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error("No email found in Google profile"));
            return;
          }

          let user = await User.findOne({
            $or: [{ emailId: email }, { googleId: profile.id }],
          });

          if (!user) {
            user = await User.create({
              firstName: profile.name?.givenName || "Developer",
              lastName: profile.name?.familyName,
              emailId: email,
              authProvider: "google",
              googleId: profile.id,
              photoUrl: profile.photos?.[0]?.value,
              isSeed: false,
            });
          } else if (user.authProvider !== "google") {
            user.authProvider = "google";
            user.googleId = profile.id;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error instanceof Error ? error : new Error("OAuth failure"));
        }
      },
    ),
  );
};
