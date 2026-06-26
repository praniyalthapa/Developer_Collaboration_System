import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "ready";

export const AuthStatusContext = createContext<AuthStatus>("loading");

export const useAuthStatus = (): AuthStatus => useContext(AuthStatusContext);
