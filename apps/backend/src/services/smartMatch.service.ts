import type { Types } from "mongoose";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { User, USER_SAFE_FIELDS } from "../models/user.model";
import type { SafeUser } from "../types/dto";
import type { Pagination } from "../validators/common";
import { rankBySkillSimilarity } from "./match/cosineSimilarity";

export interface SmartMatch {
  user: SafeUser;
  similarity: number;
  sharedSkills: string[];
}

export interface SmartMatchResult {
  matches: SmartMatch[];
  total: number;
  page: number;
  totalPages: number;
}

export const getSmartMatches = async (
  userId: Types.ObjectId,
  pagination: Pagination,
): Promise<SmartMatchResult> => {
  const currentUser = await User.findById(userId).select("skills").lean();
  const currentSkills = currentUser?.skills ?? [];

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

  const candidates = await User.find({
    _id: { $nin: Array.from(excluded) },
  })
    .select(`${USER_SAFE_FIELDS}`)
    .lean<SafeUser[]>();

  // Rank candidates by cosine similarity of their skills to the current user's.
  const scored: SmartMatch[] = rankBySkillSimilarity(
    currentSkills,
    candidates,
    (candidate) => candidate.skills,
  )
    .filter((ranked) => ranked.similarity > 0)
    .map((ranked) => ({
      user: ranked.item,
      similarity: ranked.similarity,
      sharedSkills: ranked.sharedSkills,
    }));

  const skip = (pagination.page - 1) * pagination.limit;
  return {
    matches: scored.slice(skip, skip + pagination.limit),
    total: scored.length,
    page: pagination.page,
    totalPages: Math.max(1, Math.ceil(scored.length / pagination.limit)),
  };
};
