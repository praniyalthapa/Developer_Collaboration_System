import type { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: "Not Found" });
};

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: number }).code === 11000;

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof MongooseError.ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ message: `Invalid value for "${err.path}"` });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({ message: "A record with that value already exists" });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    message: isProduction
      ? "Internal Server Error"
      : err instanceof Error
        ? err.message
        : "Internal Server Error",
  });
};
