import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { paginationSchema } from "../validators/common";
import { getSmartMatches } from "../services/smartMatch.service";

export const listSmartMatches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = getAuthUser(req);
  const pagination = paginationSchema.parse(req.query);
  res.json(await getSmartMatches(user._id, pagination));
};
