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
import { turnRoutes } from "./turn.routes";
import { connectionSuggestionRoutes } from "./connectionSuggestion.routes";

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
apiRouter.use(turnRoutes);
apiRouter.use(connectionSuggestionRoutes);
// adminRoutes applies a router-level authorize("admin") that runs for every
// request flowing through it, so it must stay LAST — anything mounted after it
// would be blocked for non-admins.
apiRouter.use(adminRoutes);
