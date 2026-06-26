import type { FilterQuery, Types } from "mongoose";
import { User, type IUser, type UserDocument } from "../models/user.model";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { Chat } from "../models/chat.model";
import { CodeSession } from "../models/codeSession.model";
import { ApiError } from "../utils/apiError";
import type { UserRole } from "../types/enums";
import type { AdminUsersQuery } from "../validators/admin.schema";

const ADMIN_USER_FIELDS =
  "firstName lastName emailId role isPremium isSeed authProvider createdAt";

export interface AdminUserView {
  _id: Types.ObjectId;
  firstName: string;
  lastName?: string;
  emailId: string;
  role: UserRole;
  isPremium: boolean;
  isSeed: boolean;
  authProvider: string;
  createdAt: Date;
}

export interface PaginatedUsers {
  users: AdminUserView[];
  total: number;
  page: number;
  totalPages: number;
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listUsers = async (
  query: AdminUsersQuery,
): Promise<PaginatedUsers> => {
  const filter: FilterQuery<IUser> = {};
  if (query.search) {
    const pattern = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [
      { firstName: pattern },
      { lastName: pattern },
      { emailId: pattern },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select(ADMIN_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean<AdminUserView[]>(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
};

export interface AdminStats {
  totalUsers: number;
  admins: number;
  premiumUsers: number;
  acceptedConnections: number;
  pendingRequests: number;
  activeChats: number;
  codeSessions: number;
}

export const getStats = async (): Promise<AdminStats> => {
  const [
    totalUsers,
    admins,
    premiumUsers,
    acceptedConnections,
    pendingRequests,
    activeChats,
    codeSessions,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isPremium: true }),
    ConnectionRequest.countDocuments({ status: "accepted" }),
    ConnectionRequest.countDocuments({ status: "interested" }),
    Chat.countDocuments({}),
    CodeSession.countDocuments({ isActive: true }),
  ]);

  return {
    totalUsers,
    admins,
    premiumUsers,
    acceptedConnections,
    pendingRequests,
    activeChats,
    codeSessions,
  };
};

export const updateUserRole = async (
  actingAdminId: Types.ObjectId,
  userId: string,
  role: UserRole,
): Promise<UserDocument> => {
  if (actingAdminId.toString() === userId) {
    throw ApiError.badRequest("You cannot change your own role");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  user.role = role;
  await user.save();
  return user;
};

export const deleteUser = async (
  actingAdminId: Types.ObjectId,
  userId: string,
): Promise<void> => {
  if (actingAdminId.toString() === userId) {
    throw ApiError.badRequest("Use the profile settings to delete your own account");
  }
  const user = await User.exists({ _id: userId });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  await Promise.all([
    ConnectionRequest.deleteMany({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    }),
    Chat.deleteMany({ participants: userId }),
  ]);
  await User.findByIdAndDelete(userId);
};
