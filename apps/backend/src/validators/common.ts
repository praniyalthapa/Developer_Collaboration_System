import { z } from "zod";
import { isValidObjectId } from "mongoose";

export const objectIdSchema = z
  .string()
  .refine((value) => isValidObjectId(value), "Invalid identifier");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type Pagination = z.infer<typeof paginationSchema>;
