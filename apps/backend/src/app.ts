import path from "node:path";
import express, { type Application, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { corsOrigins, isProduction } from "./config/env";
import { configurePassport } from "./config/passport";
import { apiRouter } from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error";

const UPLOADS_DIR = path.join(__dirname, "../uploads");

export const createApp = (): Application => {
  configurePassport();

  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(morgan(isProduction ? "combined" : "dev"));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/api/uploads",
    (_req: Request, res: Response, next) => {
      res.header("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(UPLOADS_DIR),
  );

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
