import { z } from "zod";
import { objectIdSchema } from "./common";

export const createCodeSessionSchema = z.object({
  targetUserId: objectIdSchema,
});

export const codeSessionParamsSchema = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{64}$/, "Invalid session id"),
});

export type CreateCodeSessionInput = z.infer<typeof createCodeSessionSchema>;
