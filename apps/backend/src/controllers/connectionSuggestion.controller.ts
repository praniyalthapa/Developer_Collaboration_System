import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { getConnectionSuggestions } from "../services/connectionSuggestion.service";

export const connectionSuggestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await getConnectionSuggestions(user._id) });
};
