import { createContext, useContext } from "react";

export type ToastVariant = "info" | "success" | "message" | "error";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  variant: ToastVariant;
  onClick?: () => void;
}

export type ToastInput = Omit<Toast, "id">;

export interface ToastApi {
  push: (toast: ToastInput) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi>({
  push: () => undefined,
  dismiss: () => undefined,
});

export const useToast = (): ToastApi => useContext(ToastContext);
