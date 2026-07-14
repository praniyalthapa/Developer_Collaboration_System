import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import {
  cancelRequestParamsSchema,
  reviewRequestParamsSchema,
  sendRequestParamsSchema,
} from "../validators/request.schema";
import {
  cancelRequest,
  reviewRequest,
  sendRequest,
} from "../services/request.service";
import { getIo } from "../socket";

export const send = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { status, toUserId } = sendRequestParamsSchema.parse(req.params);
  const data = await sendRequest(user._id, toUserId, status);

  // "interested" is an actual connection request — ping the recipient in real
  // time so it surfaces as a toast/badge wherever they are in the app.
  if (status === "interested") {
    getIo()
      ?.to(`user:${toUserId}`)
      .emit("connectionRequestReceived", {
        fromUserId: user._id.toString(),
        fromName: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      });
  }

  res.status(201).json({ message: `Request marked as ${status}`, data });
};

export const review = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { status, requestId } = reviewRequestParamsSchema.parse(req.params);
  const data = await reviewRequest(user._id, requestId, status);
  res.json({ message: `Connection request ${status}`, data });
};

export const cancel = async (req: Request, res: Response): Promise<void> => {
  const user = getAuthUser(req);
  const { requestId } = cancelRequestParamsSchema.parse(req.params);
  await cancelRequest(user._id, requestId);
  res.json({ message: "Connection request cancelled" });
};
