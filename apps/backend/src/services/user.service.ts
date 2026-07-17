import type { Types } from "mongoose";
import {
  ConnectionRequest,
  type IConnectionRequest,
} from "../models/connectionRequest.model";
import { User, USER_SAFE_FIELDS } from "../models/user.model";
import type { RelationshipStatus, SafeUser, SearchUser } from "../types/dto";
import type { Pagination } from "../validators/common";

interface ReceivedRequest {
  _id: Types.ObjectId;
  status: IConnectionRequest["status"];
  createdAt: Date;
  fromUserId: SafeUser;
}

interface SentRequest {
  _id: Types.ObjectId;
  status: IConnectionRequest["status"];
  createdAt: Date;
  toUserId: SafeUser;
}

export const getReceivedRequests = async (
  userId: Types.ObjectId,
): Promise<ReceivedRequest[]> => {
  return ConnectionRequest.find({ toUserId: userId, status: "interested" })
    .populate<{ fromUserId: SafeUser }>("fromUserId", USER_SAFE_FIELDS)
    .select("status createdAt fromUserId")
    .sort({ createdAt: -1 })
    .lean<ReceivedRequest[]>();
};

export const getSentRequests = async (
  userId: Types.ObjectId,
): Promise<SentRequest[]> => {
  return ConnectionRequest.find({ fromUserId: userId })
    .populate<{ toUserId: SafeUser }>("toUserId", USER_SAFE_FIELDS)
    .select("status createdAt toUserId")
    .sort({ createdAt: -1 })
    .lean<SentRequest[]>();
};

export const getConnections = async (
  userId: Types.ObjectId,
): Promise<SafeUser[]> => {
  const requests = await ConnectionRequest.find({
    status: "accepted",
    $or: [{ toUserId: userId }, { fromUserId: userId }],
  })
    .populate<{ fromUserId: SafeUser; toUserId: SafeUser }>([
      { path: "fromUserId", select: USER_SAFE_FIELDS },
      { path: "toUserId", select: USER_SAFE_FIELDS },
    ])
    .lean<Array<{ fromUserId: SafeUser; toUserId: SafeUser }>>();

  return requests.map((request) =>
    request.fromUserId._id.equals(userId)
      ? request.toUserId
      : request.fromUserId,
  );
};

export const searchUsers = async (
  userId: Types.ObjectId,
  query: string,
): Promise<SearchUser[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Split the query by spaces into individual words/tokens
  const words = trimmed.split(/\s+/);

  // Map each word into an $or condition matching firstName, lastName, or skills
  const andConditions = words.map((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { skills: regex },
      ],
    };
  });

  const users = await User.find({
    _id: { $ne: userId },
    $and: andConditions,
  })
    .select(USER_SAFE_FIELDS)
    .limit(10)
    .lean<SafeUser[]>();

  if (users.length === 0) return [];


  const ids = users.map((user) => user._id);
  const requests = await ConnectionRequest.find({
    $or: [
      { fromUserId: userId, toUserId: { $in: ids } },
      { toUserId: userId, fromUserId: { $in: ids } },
    ],
  })
    .select("fromUserId toUserId status")
    .lean<
      Array<{
        fromUserId: Types.ObjectId;
        toUserId: Types.ObjectId;
        status: IConnectionRequest["status"];
      }>
    >();

  const statusByUser = new Map<string, RelationshipStatus>();
  for (const request of requests) {
    const iAmSender = request.fromUserId.equals(userId);
    const otherId = (
      iAmSender ? request.toUserId : request.fromUserId
    ).toString();
    let status: RelationshipStatus;
    if (request.status === "accepted") {
      status = "connected";
    } else if (request.status === "interested") {
      // Only a still-pending request is actionable.
      status = iAmSender ? "requested" : "incoming";
    } else {
      continue;
    }
    if (statusByUser.get(otherId) !== "connected") {
      statusByUser.set(otherId, status);
    }
  }

  return users.map((user) => ({
    ...user,
    connectionStatus: statusByUser.get(user._id.toString()) ?? "none",
  }));
};


export const getFeed = async (
  userId: Types.ObjectId,
  pagination: Pagination,
): Promise<SafeUser[]> => {
  const relatedRequests = await ConnectionRequest.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .select("fromUserId toUserId")
    .lean();

  const excluded = new Set<string>([userId.toString()]);
  for (const request of relatedRequests) {
    excluded.add(request.fromUserId.toString());
    excluded.add(request.toUserId.toString());
  }

  const skip = (pagination.page - 1) * pagination.limit;
  return User.find({ _id: { $nin: Array.from(excluded) } })
    .select(USER_SAFE_FIELDS)
    .skip(skip)
    .limit(pagination.limit)
    .lean<SafeUser[]>();
};
