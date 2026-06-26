import { User, type UserDocument } from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { sendMail, buildWelcomeEmail } from "../utils/mailer";
import type { LoginInput, SignupInput } from "../validators/auth.schema";

export interface AuthResult {
  user: UserDocument;
  token: string;
}

export const registerUser = async (input: SignupInput): Promise<AuthResult> => {
  const existing = await User.findOne({ emailId: input.emailId }).lean();
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    emailId: input.emailId,
    password: passwordHash,
    age: input.age,
    gender: input.gender,
    authProvider: "local",
    isSeed: false,
  });

  void sendMail({ to: user.emailId, ...buildWelcomeEmail(user.firstName) });

  return { user, token: signAuthToken(user._id.toString()) };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ emailId: input.emailId }).select("+password");
  if (!user || !user.password) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const passwordMatches = await comparePassword(input.password, user.password);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  user.password = undefined;
  return { user, token: signAuthToken(user._id.toString()) };
};
