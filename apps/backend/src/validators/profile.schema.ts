import { z } from "zod";
import validator from "validator";
import { GENDERS } from "../types/enums";

const photoUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith("/api/uploads/") || validator.isURL(value),
    "Invalid photo URL",
  );

export const editProfileSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().max(50),
    photoUrl: photoUrlSchema,
    gender: z.enum(GENDERS),
    age: z.coerce.number().int().min(18),
    about: z.string().trim().max(600),
    skills: z.array(z.string().trim().min(1).max(40)).max(50),
  })
  .partial()
  .strict();

export type EditProfileInput = z.infer<typeof editProfileSchema>;
