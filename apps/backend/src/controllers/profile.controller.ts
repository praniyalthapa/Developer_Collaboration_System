import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { editProfileSchema } from "../validators/profile.schema";
import { deleteAccount, updateProfile } from "../services/profile.service";
import { clearAuthCookie } from "../utils/cookies";

export const viewProfile = async (req: Request, res: Response): Promise<void> => {
  res.json({ data: getAuthUser(req) });
};

export const editProfile = async (req: Request, res: Response): Promise<void> => {
  const changes = editProfileSchema.parse(req.body);
  const user = await updateProfile(getAuthUser(req), changes);
  res.json({ message: "Profile updated successfully", data: user });
};

export const removeProfile = async (req: Request, res: Response): Promise<void> => {
  await deleteAccount(getAuthUser(req));
  clearAuthCookie(res);
  res.json({ message: "Your account has been deleted" });
};
