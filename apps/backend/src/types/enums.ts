export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_PROVIDERS = ["local", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const CONNECTION_STATUSES = [
  "ignored",
  "interested",
  "accepted",
  "rejected",
] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const SEND_REQUEST_STATUSES = ["ignored", "interested"] as const;
export type SendRequestStatus = (typeof SEND_REQUEST_STATUSES)[number];

export const REVIEW_REQUEST_STATUSES = ["accepted", "rejected"] as const;
export type ReviewRequestStatus = (typeof REVIEW_REQUEST_STATUSES)[number];

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "go",
  "rust",
  "html",
  "css",
  "json",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const MEMBERSHIP_TYPES = ["month", "silver", "gold", "coffee"] as const;
export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];

export const MEMBERSHIP_AMOUNTS: Record<MembershipType, number> = {
  month: 99,
  silver: 300,
  gold: 700,
  coffee: 99,
};
