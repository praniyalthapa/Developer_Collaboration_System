import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createSession,
  getSession,
  listSessions,
  removeSession,
} from "../controllers/codeSession.controller";

export const codeSessionRoutes = Router();

codeSessionRoutes.use(authenticate);
codeSessionRoutes.post("/code-session/create", asyncHandler(createSession));
codeSessionRoutes.get("/code-session", asyncHandler(listSessions));
codeSessionRoutes.get("/code-session/:sessionId", asyncHandler(getSession));
codeSessionRoutes.delete("/code-session/:sessionId", asyncHandler(removeSession));
