import { env } from "../config/env";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

const threshold = env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug;

const write = (level: Level, message: string, meta?: unknown): void => {
  if (LEVELS[level] < threshold) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const sink =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (meta !== undefined) sink(line, meta);
  else sink(line);
};

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
