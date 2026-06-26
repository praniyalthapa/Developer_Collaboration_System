import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { runCode } from "../controllers/execute.controller";

const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many runs, please slow down" },
});

export const executeRoutes = Router();

executeRoutes.use(authenticate);
executeRoutes.post("/execute", executeLimiter, asyncHandler(runCode));
