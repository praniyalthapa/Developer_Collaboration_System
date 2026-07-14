import "dotenv/config";
import { z } from "zod";

const booleanFromString = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    return defaultValue;
  }, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(7777),
  HOST: z.string().default("0.0.0.0"),

  MONGO_URI: z.string().default("mongodb://localhost:27017/devcollab"),

  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET is required" })
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(8 * 60 * 60 * 1000),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  WEB_APP_URL: z.string().default("http://localhost:5173"),
  BACKEND_BASE_URL: z.string().default("http://localhost:7777"),

  RUN_SEED: booleanFromString(false),
  CODE_EXECUTION_ENABLED: booleanFromString(true),
  ADMIN_EMAIL: z.string().email().default("admin@devcollab.dev"),
  ADMIN_PASSWORD: z.string().min(8).default("Admin@12345"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("DevCollab <no-reply@devcollab.dev>"),

  PAYMENTS_ENABLED: booleanFromString(false),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // TURN relay for video calls across NATs. We use Metered's hosted TURN:
  // the backend fetches short-lived credentials from their API so the key is
  // never shipped to the browser. Swap these to move to a fresh free account.
  METERED_DOMAIN: z.string().optional(),
  METERED_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
export const googleOAuthEnabled =
  Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);
export const paymentsEnabled =
  env.PAYMENTS_ENABLED && Boolean(env.RAZORPAY_KEY_ID) && Boolean(env.RAZORPAY_KEY_SECRET);
export const smtpEnabled = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
export const codeExecutionEnabled = env.CODE_EXECUTION_ENABLED;
export const turnEnabled = Boolean(env.METERED_DOMAIN && env.METERED_API_KEY);
