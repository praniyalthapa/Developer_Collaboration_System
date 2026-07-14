import type { Request, Response } from "express";
import { getIceServers } from "../services/turn.service";

export const iceServers = async (_req: Request, res: Response): Promise<void> => {
  res.json({ data: await getIceServers() });
};
