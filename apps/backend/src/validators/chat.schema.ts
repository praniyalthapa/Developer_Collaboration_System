import { z } from "zod";
import { objectIdSchema } from "./common";

export const chatParamsSchema = z.object({
  targetUserId: objectIdSchema,
});

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, "Message text is required").max(5000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
