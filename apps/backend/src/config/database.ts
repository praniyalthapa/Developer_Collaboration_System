import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 15;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const connection = await mongoose.connect(env.MONGO_URI);
      logger.info("Database connection established");
      return connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `MongoDB not ready (attempt ${attempt}/${MAX_RETRIES}): ${message}`,
      );
      if (attempt === MAX_RETRIES) {
        throw new Error(`Could not connect to MongoDB after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error("Unreachable database connection state");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
