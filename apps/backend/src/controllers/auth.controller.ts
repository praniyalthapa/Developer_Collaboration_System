import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../validators/auth.schema";
import { loginUser, registerUser } from "../services/auth.service";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const input = signupSchema.parse(req.body);
  const { user, token } = await registerUser(input);
  setAuthCookie(res, token);
  res.status(201).json({ message: "Account created successfully", data: user });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const input = loginSchema.parse(req.body);
  const { user, token } = await loginUser(input);
  setAuthCookie(res, token);
  res.json({ message: "Logged in successfully", data: user });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
};
