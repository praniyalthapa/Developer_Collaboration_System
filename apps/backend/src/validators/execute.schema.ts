import { z } from "zod";

export const executeSchema = z.object({
  language: z.enum(["javascript", "typescript", "python", "java", "go"]),
  code: z.string().min(1).max(50000),
});

export type ExecuteInput = z.infer<typeof executeSchema>;
