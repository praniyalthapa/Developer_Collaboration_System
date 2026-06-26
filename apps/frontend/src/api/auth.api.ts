import { apiClient, unwrap } from "../lib/apiClient";
import type { CurrentUser } from "../types/models";

export interface SignupPayload {
  firstName: string;
  lastName: string;
  emailId: string;
  password: string;
}

export interface LoginPayload {
  emailId: string;
  password: string;
}

export const signup = async (payload: SignupPayload): Promise<CurrentUser> => {
  const res = await apiClient.post<{ data: CurrentUser }>("/signup", payload);
  return unwrap(res.data);
};

export const login = async (payload: LoginPayload): Promise<CurrentUser> => {
  const res = await apiClient.post<{ data: CurrentUser }>("/login", payload);
  return unwrap(res.data);
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/logout");
};
