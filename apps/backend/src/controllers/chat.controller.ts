import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { chatParamsSchema, sendMessageSchema } from "../validators/chat.schema";
import {
  getOrCreateChat,
  listChats,
  sendMessage,
} from "../services/chat.service";

export const getChat = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { targetUserId } = chatParamsSchema.parse(req.params);
  res.json({ data: await getOrCreateChat(user._id, targetUserId) });
};

export const postMessage = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { targetUserId } = chatParamsSchema.parse(req.params);
  const { text } = sendMessageSchema.parse(req.body);
  const message = await sendMessage(user._id, targetUserId, text);
  res.status(201).json({ message: "Message sent", data: message });
};

export const myChats = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  res.json({ data: await listChats(user._id) });
};
