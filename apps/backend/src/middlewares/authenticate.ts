import type { NextFunction, Request, Response } from "express";
import { User, type UserDocument } from "../models/user.model";
import { verifyAuthToken } from "../utils/jwt";
import { AUTH_COOKIE } from "../utils/cookies";
import { ApiError } from "../utils/apiError";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token: unknown = req.cookies?.[AUTH_COOKIE];
    if (typeof token !== "string" || token.length === 0) {
      throw ApiError.unauthorized();
    }
    const { sub } = verifyAuthToken(token);
    const user = await User.findById(sub);
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : ApiError.unauthorized());
  }
};

export const getAuthUser = (req: Request): UserDocument => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
};
