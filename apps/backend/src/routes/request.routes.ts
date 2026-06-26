import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { cancel, review, send } from "../controllers/request.controller";

export const requestRoutes = Router();

requestRoutes.use(authenticate);
requestRoutes.post("/request/send/:status/:toUserId", asyncHandler(send));
requestRoutes.post("/request/review/:status/:requestId", asyncHandler(review));
requestRoutes.delete("/request/cancel/:requestId", asyncHandler(cancel));
