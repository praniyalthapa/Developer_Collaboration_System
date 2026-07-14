import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  connections,
  feed,
  receivedRequests,
  search,
  sentRequests,
} from "../controllers/user.controller";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/user/requests/received", asyncHandler(receivedRequests));
userRoutes.get("/user/requests/sent", asyncHandler(sentRequests));
userRoutes.get("/user/connections", asyncHandler(connections));
userRoutes.get("/user/search", asyncHandler(search));
userRoutes.get("/feed", asyncHandler(feed));
