import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type RoleGuardProps = {
  isAuthenticated: boolean;
  userRoles?: string[] | null;
  allow: string[];
  children: ReactNode;
  redirectTo?: string;
};

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((r) => r.trim().toUpperCase());
}

export default function RoleGuard({
  isAuthenticated,
  userRoles,
  allow,
  children,
  redirectTo = "/403",
}: RoleGuardProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedUserRoles = normalizeRoles(userRoles);
  const normalizedAllow = normalizeRoles(allow);

  const isAllowed = normalizedAllow.some((role) =>
    normalizedUserRoles.includes(role)
  );

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}