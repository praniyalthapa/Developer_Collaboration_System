import path from "node:path";
import fs from "node:fs";
import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/authenticate";
import { UPLOADS_DIR } from "../middlewares/upload";
import { ApiError } from "../utils/apiError";

export const uploadProfilePhoto = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = getAuthUser(req);
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  if (user.photoUrl.startsWith("/api/uploads/")) {
    const previous = path.join(UPLOADS_DIR, path.basename(user.photoUrl));
    await fs.promises.unlink(previous).catch(() => undefined);
  }

  user.photoUrl = `/api/uploads/${req.file.filename}`;
  await user.save();
  res.json({ message: "Profile photo updated", data: user });
};
