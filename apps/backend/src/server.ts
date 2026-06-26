import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeSocket } from "./socket";
import { startCronJobs } from "./cron";
import { logger } from "./utils/logger";

const bootstrap = async (): Promise<void> => {
  const app = createApp();
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(`Server listening on ${env.HOST}:${env.PORT}`);
  });

  try {
    await connectDatabase();
    startCronJobs();
  } catch (error) {
    logger.error("Startup failed", error);
    process.exit(1);
  }
};

void bootstrap();

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});
