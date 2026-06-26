import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { oauthRoutes } from "./oauth.routes";
import { profileRoutes } from "./profile.routes";
import { userRoutes } from "./user.routes";
import { requestRoutes } from "./request.routes";
import { chatRoutes } from "./chat.routes";
import { codeSessionRoutes } from "./codeSession.routes";
import { uploadRoutes } from "./upload.routes";
import { smartMatchRoutes } from "./smartMatch.routes";
import { executeRoutes } from "./execute.routes";
import { adminRoutes } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use(oauthRoutes);
apiRouter.use(authRoutes);
apiRouter.use(profileRoutes);
apiRouter.use(userRoutes);
apiRouter.use(requestRoutes);
apiRouter.use(chatRoutes);
apiRouter.use(codeSessionRoutes);
apiRouter.use(uploadRoutes);
apiRouter.use(smartMatchRoutes);
apiRouter.use(executeRoutes);
apiRouter.use(adminRoutes);
