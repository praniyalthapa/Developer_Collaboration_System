import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import {
  changeUserRole,
  getDashboardStats,
  getUsers,
  removeUser,
} from "../controllers/admin.controller";

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize("admin"));
adminRoutes.get("/admin/stats", asyncHandler(getDashboardStats));
adminRoutes.get("/admin/users", asyncHandler(getUsers));
adminRoutes.patch("/admin/users/:userId/role", asyncHandler(changeUserRole));
adminRoutes.delete("/admin/users/:userId", asyncHandler(removeUser));
