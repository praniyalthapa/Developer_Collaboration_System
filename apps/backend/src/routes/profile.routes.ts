import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  editProfile,
  removeProfile,
  viewProfile,
} from "../controllers/profile.controller";

export const profileRoutes = Router();

profileRoutes.use(authenticate);
profileRoutes.get("/profile/view", asyncHandler(viewProfile));
profileRoutes.patch("/profile/edit", asyncHandler(editProfile));
profileRoutes.delete("/profile/delete", asyncHandler(removeProfile));
