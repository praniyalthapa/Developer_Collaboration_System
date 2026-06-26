import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { getChat, myChats, postMessage } from "../controllers/chat.controller";

export const chatRoutes = Router();

chatRoutes.use(authenticate);
chatRoutes.get("/chats", asyncHandler(myChats));
chatRoutes.get("/chat/:targetUserId", asyncHandler(getChat));
chatRoutes.post("/chat/:targetUserId", asyncHandler(postMessage));
