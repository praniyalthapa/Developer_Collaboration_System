import axios, { type AxiosError } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

interface Envelope<T> {
  data: T;
}

export const unwrap = <T>(payload: Envelope<T>): T => payload.data;

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const data = axiosError.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    return axiosError.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const isUnauthorized = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;
