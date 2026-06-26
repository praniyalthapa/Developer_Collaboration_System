import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { listSmartMatches } from "../controllers/smartMatch.controller";

export const smartMatchRoutes = Router();

smartMatchRoutes.use(authenticate);
smartMatchRoutes.get("/smart-matches", asyncHandler(listSmartMatches));
