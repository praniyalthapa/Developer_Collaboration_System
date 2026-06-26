import type { Types } from "mongoose";
import {
  CodeSession,
  type CodeSessionDocument,
} from "../models/codeSession.model";
import { User } from "../models/user.model";
import { getSecretRoomId } from "../utils/room";
import { ApiError } from "../utils/apiError";

const POPULATE_FIELDS = "firstName lastName photoUrl";

export const createOrGetSession = async (
  userId: Types.ObjectId,
  targetUserId: string,
): Promise<CodeSessionDocument> => {
  if (userId.toString() === targetUserId) {
    throw ApiError.badRequest("Cannot start a session with yourself");
  }

  const target = await User.exists({ _id: targetUserId });
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  const sessionId = getSecretRoomId(userId.toString(), targetUserId);
  const existing = await CodeSession.findOne({ sessionId });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return existing;
  }

  return CodeSession.create({
    sessionId,
    participants: [userId, targetUserId],
    createdBy: userId,
  });
};

export const getSessionForUser = async (
  userId: Types.ObjectId,
  sessionId: string,
): Promise<CodeSessionDocument> => {
  const session = await CodeSession.findOne({ sessionId })
    .populate("participants", POPULATE_FIELDS)
    .populate("createdBy", POPULATE_FIELDS);

  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  const isParticipant = session.participants.some((participant) =>
    participant._id.equals(userId),
  );
  if (!isParticipant) {
    throw ApiError.forbidden();
  }

  return session;
};

export const listSessionsForUser = async (
  userId: Types.ObjectId,
): Promise<CodeSessionDocument[]> => {
  return CodeSession.find({ participants: userId, isActive: true })
    .populate("participants", POPULATE_FIELDS)
    .populate("createdBy", POPULATE_FIELDS)
    .sort({ lastActivity: -1 });
};

export const deactivateSession = async (
  userId: Types.ObjectId,
  sessionId: string,
): Promise<void> => {
  const session = await CodeSession.findOne({ sessionId });
  if (!session) {
    throw ApiError.notFound("Session not found");
  }
  if (!session.createdBy.equals(userId)) {
    throw ApiError.forbidden("Only the session creator can close it");
  }
  session.isActive = false;
  await session.save();
};
