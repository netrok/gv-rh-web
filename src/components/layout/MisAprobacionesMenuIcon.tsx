import { Badge } from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { useQuery } from "@tanstack/react-query";
import { getMisAprobaciones } from "../../api/aprobaciones.api";
import { useAuth } from "../../features/auth/AuthContext";

const APROBACIONES_ROLES = ["ADMIN", "RRHH", "JEFE"];

function normalizeRole(role?: string | null) {
  return (role ?? "").trim().toUpperCase();
}

export default function MisAprobacionesMenuIcon() {
  const { isAuthenticated, roles = [] } = useAuth();

  const normalizedRoles = roles.map(normalizeRole);
  const canSeeAprobaciones = APROBACIONES_ROLES.some((role) =>
    normalizedRoles.includes(role)
  );

  const { data } = useQuery({
    queryKey: ["mis-aprobaciones-menu-badge"],
    queryFn: getMisAprobaciones,
    enabled: isAuthenticated && canSeeAprobaciones,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const totalPendientes = data?.totalPendientes ?? 0;

  return (
    <Badge
      badgeContent={totalPendientes > 99 ? "99+" : totalPendientes}
      color="error"
      invisible={totalPendientes <= 0}
      overlap="circular"
    >
      <FactCheckIcon />
    </Badge>
  );
}
