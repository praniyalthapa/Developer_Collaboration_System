import { Navigate, Outlet } from "react-router-dom";
import { useAuthStatus } from "../context/authStore";
import { useAppSelector } from "../app/hooks";
import { FullScreenLoader } from "./ui/Loader";

export const ProtectedRoute = () => {
  const status = useAuthStatus();
  const user = useAppSelector((state) => state.user);

  if (status === "loading") {
    return <FullScreenLoader label="Loading your workspace..." />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const AdminRoute = () => {
  const user = useAppSelector((state) => state.user);
  if (!user || user.role !== "admin") {
    return <Navigate to="/feed" replace />;
  }
  return <Outlet />;
};
