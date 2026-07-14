import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { connectionSuggestions } from "../controllers/connectionSuggestion.controller";

export const connectionSuggestionRoutes = Router();

connectionSuggestionRoutes.use(authenticate);
connectionSuggestionRoutes.get(
  "/connection-suggestions",
  asyncHandler(connectionSuggestions),
);
