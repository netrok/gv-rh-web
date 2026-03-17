import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type RequireAuthProps = {
  isAuthenticated: boolean;
  children: ReactNode;
};

export default function RequireAuth({
  isAuthenticated,
  children,
}: RequireAuthProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}