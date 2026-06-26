import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import {
  adminUserParamsSchema,
  adminUsersQuerySchema,
  updateRoleSchema,
} from "../validators/admin.schema";
import {
  deleteUser,
  getStats,
  listUsers,
  updateUserRole,
} from "../services/admin.service";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const query = adminUsersQuerySchema.parse(req.query);
  res.json(await listUsers(query));
};

export const getDashboardStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.json({ data: await getStats() });
};

export const changeUserRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const admin = getAuthUser(req);
  const { userId } = adminUserParamsSchema.parse(req.params);
  const { role } = updateRoleSchema.parse(req.body);
  const user = await updateUserRole(admin._id, userId, role);
  res.json({ message: "Role updated", data: user });
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
  const admin = getAuthUser(req);
  const { userId } = adminUserParamsSchema.parse(req.params);
  await deleteUser(admin._id, userId);
  res.json({ message: "User deleted" });
};
