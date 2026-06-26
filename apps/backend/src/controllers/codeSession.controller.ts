import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import {
  codeSessionParamsSchema,
  createCodeSessionSchema,
} from "../validators/codeSession.schema";
import {
  createOrGetSession,
  deactivateSession,
  getSessionForUser,
  listSessionsForUser,
} from "../services/codeSession.service";

export const createSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = getAuthUser(req);
  const { targetUserId } = createCodeSessionSchema.parse(req.body);
  const session = await createOrGetSession(user._id, targetUserId);
  res.status(201).json({ message: "Code session ready", data: session });
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { sessionId } = codeSessionParamsSchema.parse(req.params);
  res.json({ data: await getSessionForUser(user._id, sessionId) });
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await listSessionsForUser(user._id) });
};

export const removeSession = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { sessionId } = codeSessionParamsSchema.parse(req.params);
  await deactivateSession(user._id, sessionId);
  res.json({ message: "Session closed" });
};
