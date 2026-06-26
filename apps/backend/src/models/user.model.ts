import { Schema, model, type HydratedDocument } from "mongoose";
import validator from "validator";
import {
  AUTH_PROVIDERS,
  GENDERS,
  USER_ROLES,
  type AuthProvider,
  type Gender,
  type UserRole,
} from "../types/enums";

const buildDefaultAvatar = (firstName?: string, lastName?: string): string => {
  const seed = encodeURIComponent(`${firstName ?? "Dev"} ${lastName ?? ""}`.trim());
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&backgroundType=gradientLinear`;
};

const DEFAULT_ABOUT =
  "Software developer passionate about building innovative solutions with modern technologies.";

export interface IUser {
  firstName: string;
  lastName?: string;
  emailId: string;
  password?: string;
  age?: number;
  gender?: Gender;
  role: UserRole;
  isPremium: boolean;
  membershipType?: string;
  isSeed: boolean;
  photoUrl: string;
  authProvider: AuthProvider;
  googleId?: string;
  about: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    lastName: { type: String, maxlength: 50, trim: true },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Invalid email address",
      },
    },
    password: { type: String, select: false },
    age: { type: Number, min: 18 },
    gender: { type: String, enum: GENDERS },
    role: { type: String, enum: USER_ROLES, default: "user" },
    isPremium: { type: Boolean, default: false },
    membershipType: { type: String },
    isSeed: { type: Boolean, default: false },
    photoUrl: {
      type: String,
      default(this: IUser | undefined): string {
        return buildDefaultAvatar(this?.firstName, this?.lastName);
      },
      validate: {
        validator: (value: string) =>
          value.startsWith("/api/uploads/") || validator.isURL(value),
        message: "Invalid photo URL",
      },
    },
    authProvider: { type: String, enum: AUTH_PROVIDERS, default: "local" },
    googleId: { type: String },
    about: { type: String, default: DEFAULT_ABOUT, maxlength: 600 },
    skills: { type: [String], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ isSeed: 1, createdAt: -1 });

export const User = model<IUser>("User", userSchema);

export const USER_SAFE_FIELDS =
  "firstName lastName photoUrl age gender about skills";
