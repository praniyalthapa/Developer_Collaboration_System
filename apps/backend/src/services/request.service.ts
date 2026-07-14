import type { Types } from "mongoose";
import {
  ConnectionRequest,
  type ConnectionRequestDocument,
} from "../models/connectionRequest.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import type {
  ReviewRequestStatus,
  SendRequestStatus,
} from "../types/enums";

export const sendRequest = async (
  fromUserId: Types.ObjectId,
  toUserId: string,
  status: SendRequestStatus,
): Promise<ConnectionRequestDocument> => {
  if (fromUserId.toString() === toUserId) {
    throw ApiError.badRequest("You cannot send a request to yourself");
  }

  const target = await User.exists({ _id: toUserId });
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  const existing = await ConnectionRequest.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });
  if (existing) {
    // A pending or accepted request is a live relationship — block a duplicate.
    // A previously rejected/ignored one is stale, so clear it and start over.
    if (existing.status === "interested" || existing.status === "accepted") {
      throw ApiError.conflict("A connection request already exists");
    }
    await existing.deleteOne();
  }

  return ConnectionRequest.create({ fromUserId, toUserId, status });
};

export const reviewRequest = async (
  toUserId: Types.ObjectId,
  requestId: string,
  status: ReviewRequestStatus,
): Promise<ConnectionRequestDocument> => {
  const request = await ConnectionRequest.findOne({
    _id: requestId,
    toUserId,
    status: "interested",
  });
  if (!request) {
    throw ApiError.notFound("Connection request not found");
  }

  request.status = status;
  await request.save();
  return request;
};

export const cancelRequest = async (
  fromUserId: Types.ObjectId,
  requestId: string,
): Promise<void> => {
  const result = await ConnectionRequest.findOneAndDelete({
    _id: requestId,
    fromUserId,
    status: { $in: ["interested", "ignored"] },
  });
  if (!result) {
    throw ApiError.notFound("Connection request not found or cannot be cancelled");
  }
};
