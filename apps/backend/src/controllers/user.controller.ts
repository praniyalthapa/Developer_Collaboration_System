import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { paginationSchema } from "../validators/common";
import {
  getConnections,
  getFeed,
  getReceivedRequests,
  getSentRequests,
  searchUsers,
} from "../services/user.service";

export const receivedRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await getReceivedRequests(user._id) });
};

export const sentRequests = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await getSentRequests(user._id) });
};

export const connections = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await getConnections(user._id) });
};

export const search = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const query = typeof req.query.q === "string" ? req.query.q : "";
  res.json({ data: await searchUsers(user._id, query) });
};

export const feed = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const pagination = paginationSchema.parse(req.query);
  res.json({ data: await getFeed(user._id, pagination) });
};
