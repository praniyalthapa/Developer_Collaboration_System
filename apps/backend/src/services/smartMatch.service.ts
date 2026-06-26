import type { Types } from "mongoose";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { User, USER_SAFE_FIELDS } from "../models/user.model";
import type { SafeUser } from "../types/dto";
import type { Pagination } from "../validators/common";

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

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export const getSmartMatches = async (
  userId: Types.ObjectId,
  pagination: Pagination,
): Promise<SmartMatchResult> => {
  const currentUser = await User.findById(userId).select("skills").lean();
  const currentSkills = new Set(
    (currentUser?.skills ?? []).map((skill) => skill.toLowerCase()),
  );

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

  const scored: SmartMatch[] = candidates
    .map((candidate) => {
      const candidateSkills = new Set(
        candidate.skills.map((skill) => skill.toLowerCase()),
      );
      const sharedSkills = candidate.skills.filter((skill) =>
        currentSkills.has(skill.toLowerCase()),
      );
      return {
        user: candidate,
        similarity: jaccardSimilarity(currentSkills, candidateSkills),
        sharedSkills,
      };
    })
    .filter((match) => match.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity);

  const skip = (pagination.page - 1) * pagination.limit;
  return {
    matches: scored.slice(skip, skip + pagination.limit),
    total: scored.length,
    page: pagination.page,
    totalPages: Math.max(1, Math.ceil(scored.length / pagination.limit)),
  };
};
