import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "../utils/apiError";
import type { UserRole } from "../types/enums";
import { getAuthUser } from "./authenticate";

export const authorize =
  (...allowedRoles: UserRole[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = getAuthUser(req);
    if (!allowedRoles.includes(user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
