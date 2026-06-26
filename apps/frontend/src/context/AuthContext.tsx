import { useEffect, useState, type ReactNode } from "react";
import { getProfile } from "../api/profile.api";
import { isUnauthorized } from "../lib/apiClient";
import { useAppDispatch } from "../app/hooks";
import { setUser } from "../features/userSlice";
import { AuthStatusContext, type AuthStatus } from "./authStore";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    getProfile()
      .then((user) => {
        if (active) dispatch(setUser(user));
      })
      .catch((error) => {
        if (!isUnauthorized(error)) {
          console.error("Failed to restore session", error);
        }
      })
      .finally(() => {
        if (active) setStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  return (
    <AuthStatusContext.Provider value={status}>
      {children}
    </AuthStatusContext.Provider>
  );
};
