import type { Types } from "mongoose";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { User, USER_SAFE_FIELDS } from "../models/user.model";
import type { SafeUser } from "../types/dto";
import {
  buildConnectionGraph,
  suggestByMutualConnections,
} from "./match/mutualConnections";

export interface ConnectionSuggestion {
  user: SafeUser;
  mutualCount: number;
}

/**
 * "People you may know": builds the accepted-connection graph and runs the BFS
 * mutual-connections algorithm to suggest friends-of-friends the user isn't
 * connected to yet, ranked by number of mutual connections.
 */
export const getConnectionSuggestions = async (
  userId: Types.ObjectId,
  limit = 10,
): Promise<ConnectionSuggestion[]> => {
  const accepted = await ConnectionRequest.find({ status: "accepted" })
    .select("fromUserId toUserId")
    .lean();

  const edges = accepted.map(
    (request) =>
      [request.fromUserId.toString(), request.toUserId.toString()] as [
        string,
        string,
      ],
  );

  const graph = buildConnectionGraph(edges);
  const suggestions = suggestByMutualConnections(
    graph,
    userId.toString(),
  ).slice(0, limit);
  if (suggestions.length === 0) return [];

  const users = await User.find({
    _id: { $in: suggestions.map((suggestion) => suggestion.userId) },
  })
    .select(USER_SAFE_FIELDS)
    .lean<SafeUser[]>();

  const byId = new Map(users.map((user) => [user._id.toString(), user]));
  return suggestions
    .map((suggestion) => {
      const user = byId.get(suggestion.userId);
      return user ? { user, mutualCount: suggestion.mutualCount } : null;
    })
    .filter((entry): entry is ConnectionSuggestion => entry !== null);
};
