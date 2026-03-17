import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type RoleGuardProps = {
  isAuthenticated: boolean;
  userRoles?: string[] | null;
  allow?: string[];
  children: ReactNode;
  redirectTo?: string;
};

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set(
      (roles ?? [])
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

export default function RoleGuard({
  isAuthenticated,
  userRoles,
  allow = [],
  children,
  redirectTo = "/403",
}: RoleGuardProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedUserRoles = normalizeRoles(userRoles);
  const normalizedAllow = normalizeRoles(allow);

  if (normalizedAllow.length === 0) {
    return <>{children}</>;
  }

  const isAllowed = normalizedAllow.some((role) =>
    normalizedUserRoles.includes(role)
  );

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}