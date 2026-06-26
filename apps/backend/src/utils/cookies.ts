import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env";

export const AUTH_COOKIE = "token";

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
});

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: env.COOKIE_MAX_AGE_MS,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.cookie(AUTH_COOKIE, "", { ...baseCookieOptions(), expires: new Date(0) });
};
