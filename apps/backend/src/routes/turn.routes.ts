import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { iceServers } from "../controllers/turn.controller";

export const turnRoutes = Router();

turnRoutes.use(authenticate);
turnRoutes.get("/turn-credentials", asyncHandler(iceServers));
