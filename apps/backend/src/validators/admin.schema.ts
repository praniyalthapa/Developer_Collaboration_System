import { z } from "zod";
import { objectIdSchema } from "./common";
import { USER_ROLES } from "../types/enums";

export const adminUserParamsSchema = z.object({
  userId: objectIdSchema,
});

export const updateRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
