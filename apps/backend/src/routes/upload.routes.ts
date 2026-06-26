import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { profilePhotoUpload } from "../middlewares/upload";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadProfilePhoto } from "../controllers/upload.controller";

export const uploadRoutes = Router();

uploadRoutes.use(authenticate);
uploadRoutes.post(
  "/upload/profile-photo",
  profilePhotoUpload,
  asyncHandler(uploadProfilePhoto),
);
