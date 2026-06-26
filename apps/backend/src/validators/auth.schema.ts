import { z } from "zod";
import validator from "validator";
import { GENDERS } from "../types/enums";

const strongPassword = z
  .string()
  .refine(
    (value) => validator.isStrongPassword(value),
    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol",
  );

export const signupSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(1).max(50),
  emailId: z.string().trim().toLowerCase().email(),
  password: strongPassword,
  age: z.coerce.number().int().min(18).optional(),
  gender: z.enum(GENDERS).optional(),
});

export const loginSchema = z.object({
  emailId: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
