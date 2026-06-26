import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler";
import { login, logout, signup } from "../controllers/auth.controller";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

export const authRoutes = Router();

authRoutes.post("/signup", authLimiter, asyncHandler(signup));
authRoutes.post("/login", authLimiter, asyncHandler(login));
authRoutes.post("/logout", asyncHandler(logout));
