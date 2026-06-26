import path from "node:path";
import fs from "node:fs";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { getAuthUser } from "./authenticate";
import { ApiError } from "../utils/apiError";

export const UPLOADS_DIR = path.join(__dirname, "../../uploads");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req: Request, file, cb) => {
    const user = getAuthUser(req);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${user._id.toString()}-${Date.now()}${ext}`);
  },
});

export const profilePhotoUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new ApiError(400, "Only JPG, PNG, GIF, and WebP images are allowed"));
  },
}).single("photo");
