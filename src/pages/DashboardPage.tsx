import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import {
  getDashboard,
  getDashboardStats,
  type DashboardCountBy,
  type DashboardData,
  type DashboardIncidenciaReciente,
  type DashboardStats,
} from "../api/dashboard.api";
import type { AuditItem } from "../api/audit.api";

const colors = {
  cardBg: "#ffffff",
  softBg: "#f8fafc",
  softBg2: "#fbfdff",
  border: "#e5e7eb",
  borderSoft: "#dbe3ee",
  text: "#111827",
  subtext: "#6b7280",
  heroFrom: "#0b1630",
  heroTo: "#14233f",
  heroGlass: "rgba(255,255,255,0.08)",
  heroGlassBorder: "rgba(255,255,255,0.12)",
  heroMuted: "rgba(255,255,255,0.76)",
  heroText: "rgba(255,255,255,0.86)",
  accent: "#1d4ed8",
  accentSoft: "#dbeafe",
  accentSoft2: "#eef2ff",
  accentText: "#1e3a8a",
  neutralIconBg: "#f3f4f6",
  neutralIconText: "#374151",
  progressBg: "#e8eef7",
  shadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
};

type QuickAction = {
  label: string;
  description: string;
  to: string;
  allow?: string[];
  icon: ReactNode;
};

type PrimaryKpi = {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
};

type MiniStat = {
  title: string;
  value: number;
  icon: ReactNode;
};

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function canAccess(userRoles: string[], allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role.toUpperCase()));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatEnumLabel(value?: string | null): string {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.title ||
      `${error.response?.status ?? ""} ${
        error.response?.statusText ?? error.message
      }`.trim() ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getActionColor(
  action: string
): "default" | "success" | "info" | "error" | "warning" | "secondary" {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "SOFT_DELETE":
    case "DELETE":
      return "error";
    case "RESTORE":
      return "warning";
    case "LOGIN":
    case "REFRESH":
    case "LOGOUT":
    case "LOGOUT_ALL":
      return "secondary";
    default:
      return "default";
  }
}

function getActionIcon(action: string): ReactNode {
  switch (action) {
    case "LOGIN":
    case "REFRESH":
    case "LOGOUT":
    case "LOGOUT_ALL":
      return <LoginRoundedIcon fontSize="small" />;
    case "CREATE":
    case "UPDATE":
      return <EditNoteRoundedIcon fontSize="small" />;
    case "SOFT_DELETE":
    case "DELETE":
      return <DeleteOutlineRoundedIcon fontSize="small" />;
    case "RESTORE":
      return <RestoreRoundedIcon fontSize="small" />;
    default:
      return <SecurityRoundedIcon fontSize="small" />;
  }
}

function getStatusColor(
  estatus?: string | null
): "default" | "success" | "error" | "warning" | "info" {
  const normalized = (estatus ?? "").trim().toUpperCase();

  switch (normalized) {
    case "APROBADA":
      return "success";
    case "RECHAZADA":
      return "error";
    case "PENDIENTE":
      return "warning";
    default:
      return "default";
  }
}

function getStatusIcon(estatus?: string | null): ReactElement {
  const normalized = (estatus ?? "").trim().toUpperCase();

  switch (normalized) {
    case "APROBADA":
      return <CheckCircleRoundedIcon fontSize="small" />;
    case "RECHAZADA":
      return <CancelRoundedIcon fontSize="small" />;
    case "PENDIENTE":
      return <HourglassTopRoundedIcon fontSize="small" />;
    default:
      return <AssessmentRoundedIcon fontSize="small" />;
  }
}

function getTipoIcon(tipo?: string | null): ReactNode {
  const normalized = (tipo ?? "").trim().toUpperCase();

  switch (normalized) {
    case "RETARDO":
      return <ScheduleRoundedIcon fontSize="small" />;
    case "FALTA":
      return <EventBusyRoundedIcon fontSize="small" />;
    case "PERMISO":
      return <EventAvailableRoundedIcon fontSize="small" />;
    case "VACACIONES":
      return <BeachAccessRoundedIcon fontSize="small" />;
    case "INCAPACIDAD":
      return <LocalHospitalRoundedIcon fontSize="small" />;
    case "OMISION_DE_CHECADA":
      return <FingerprintRoundedIcon fontSize="small" />;
    default:
      return <BadgeRoundedIcon fontSize="small" />;
  }
}

type SectionCardProps = {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
};

function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        boxShadow: colors.shadow,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: colors.text }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.subtext }}>
              {subtitle}
            </Typography>
          </Box>

          {action}
        </Stack>

        <Divider sx={{ mb: 2, borderColor: colors.border }} />

        {children}
      </CardContent>
    </Card>
  );
}

type PrimaryKpiCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  loading?: boolean;
};

function PrimaryKpiCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
}: PrimaryKpiCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        overflow: "hidden",
        boxShadow: colors.shadow,
      }}
    >
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${colors.accent} 0%, #2563eb 100%)`,
        }}
      />
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                backgroundColor: colors.accentSoft2,
                color: colors.accentText,
              }}
            >
              {icon}
            </Box>

            <Chip
              label="RH"
              size="small"
              sx={{
                fontWeight: 700,
                color: colors.accentText,
                backgroundColor: colors.accentSoft,
                border: `1px solid ${colors.accentSoft}`,
              }}
            />
          </Stack>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.75, color: colors.subtext }}>
              {title}
            </Typography>

            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1, color: colors.text }}>
                {formatNumber(value)}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mt: 1, color: colors.subtext }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type MiniStatCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  loading?: boolean;
};

function MiniStatCard({ title, value, icon, loading = false }: MiniStatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        boxShadow: colors.shadow,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              backgroundColor: colors.softBg,
              color: colors.neutralIconText,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: colors.subtext }}>
              {title}
            </Typography>

            {loading ? (
              <CircularProgress size={18} sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h6" fontWeight={800} sx={{ color: colors.text }}>
                {formatNumber(value)}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type SummaryListCardProps = {
  title: string;
  subtitle: string;
  emptyText: string;
  items: DashboardCountBy[];
  kind: "tipo" | "estatus";
};

function SummaryListCard({
  title,
  subtitle,
  emptyText,
  items,
  kind,
}: SummaryListCardProps) {
  const maxValue = Math.max(...items.map((x) => x.total), 1);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        boxShadow: colors.shadow,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              backgroundColor: colors.accentSoft2,
              color: colors.accentText,
              flexShrink: 0,
            }}
          >
            {kind === "tipo" ? (
              <AssessmentRoundedIcon fontSize="small" />
            ) : (
              <InsightsRoundedIcon fontSize="small" />
            )}
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: colors.text }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.subtext }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2, borderColor: colors.border }} />

        {items.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.subtext }}>
            {emptyText}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item) => {
              const progress = Math.max(8, Math.round((item.total / maxValue) * 100));
              const icon =
                kind === "tipo"
                  ? getTipoIcon(item.nombre)
                  : getStatusIcon(item.nombre);

              return (
                <Box
                  key={`${title}-${item.nombre}`}
                  sx={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                    p: 1.5,
                    backgroundColor: colors.softBg2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: "grid",
                          placeItems: "center",
                          backgroundColor: colors.softBg,
                          color: colors.neutralIconText,
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </Box>

                      <Typography variant="body1" fontWeight={600} sx={{ color: colors.text }}>
                        {formatEnumLabel(item.nombre)}
                      </Typography>
                    </Stack>

                    <Chip
                      label={item.total}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        color: colors.accentText,
                        backgroundColor: colors.accentSoft,
                        border: `1px solid ${colors.accentSoft}`,
                      }}
                    />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: colors.progressBg,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: colors.accent,
                        borderRadius: 999,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: 3,
        p: 1.5,
        cursor: "pointer",
        transition: "all .15s ease",
        backgroundColor: colors.softBg2,
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: colors.shadow,
          borderColor: colors.borderSoft,
        },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            backgroundColor: colors.accentSoft2,
            color: colors.accentText,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={800} sx={{ color: colors.text }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.subtext }}>
            {description}
          </Typography>
        </Box>

        <ChevronRightRoundedIcon sx={{ color: colors.subtext }} />
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { roles = [] } = useAuth();

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canSeeAudit = canAccess(normalizedRoles, ["ADMIN", "RRHH"]);

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["dashboard-incidencias"],
    queryFn: getDashboard,
  });

  const quickActions: QuickAction[] = useMemo(
    () =>
      [
        {
          label: "Empleados",
          description: "Expedientes y consulta general.",
          to: "/empleados",
          allow: ["ADMIN", "RRHH"],
          icon: <Groups2OutlinedIcon fontSize="small" />,
        },
        {
          label: "Incidencias",
          description: "Registro, revisión y seguimiento.",
          to: "/incidencias",
          allow: ["ADMIN", "RRHH"],
          icon: <PendingActionsOutlinedIcon fontSize="small" />,
        },
        {
          label: "Sucursales",
          description: "Catálogo de sedes operativas.",
          to: "/sucursales",
          allow: ["ADMIN", "RRHH"],
          icon: <StoreRoundedIcon fontSize="small" />,
        },
        {
          label: "Auditoría",
          description: "Actividad y trazabilidad del sistema.",
          to: "/audit",
          allow: ["ADMIN", "RRHH"],
          icon: <GavelRoundedIcon fontSize="small" />,
        },
        {
          label: "Departamentos",
          description: "Estructura organizacional.",
          to: "/departamentos",
          allow: ["ADMIN", "RRHH"],
          icon: <ApartmentRoundedIcon fontSize="small" />,
        },
        {
          label: "Puestos",
          description: "Roles y puestos disponibles.",
          to: "/puestos",
          allow: ["ADMIN", "RRHH"],
          icon: <WorkOutlineRoundedIcon fontSize="small" />,
        },
      ].filter((item) => canAccess(normalizedRoles, item.allow)),
    [normalizedRoles]
  );

  const statsData = statsQuery.data;
  const dashboardData = dashboardQuery.data;
  const recentAudit: AuditItem[] = statsData?.recentAudit ?? [];
  const recientes: DashboardIncidenciaReciente[] =
    dashboardData?.incidenciasRecientes ?? [];

  const primaryKpis: PrimaryKpi[] = [
    {
      title: "Empleados activos",
      value: dashboardData?.empleadosActivos ?? 0,
      subtitle: "Personal activo registrado",
      icon: <Groups2OutlinedIcon fontSize="small" />,
    },
    {
      title: "Sucursales activas",
      value: dashboardData?.sucursalesActivas ?? 0,
      subtitle: "Sedes disponibles",
      icon: <StoreRoundedIcon fontSize="small" />,
    },
    {
      title: "Incidencias pendientes",
      value: dashboardData?.incidenciasPendientes ?? 0,
      subtitle: "Esperando revisión",
      icon: <PendingActionsOutlinedIcon fontSize="small" />,
    },
    {
      title: "Incidencias del mes",
      value: dashboardData?.incidenciasMes ?? 0,
      subtitle: "Registradas en el mes actual",
      icon: <EventNoteOutlinedIcon fontSize="small" />,
    },
  ];

  const miniStats: MiniStat[] = [
    {
      title: "Departamentos",
      value: statsData?.departamentosTotal ?? 0,
      icon: <ApartmentRoundedIcon fontSize="small" />,
    },
    {
      title: "Puestos",
      value: statsData?.puestosTotal ?? 0,
      icon: <WorkOutlineRoundedIcon fontSize="small" />,
    },
    {
      title: "Auditoría",
      value: canSeeAudit ? statsData?.auditoriaTotal ?? 0 : 0,
      icon: <GavelRoundedIcon fontSize="small" />,
    },
  ];

  const refreshAll = () => {
    void statsQuery.refetch();
    void dashboardQuery.refetch();
  };

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 6,
          border: "none",
          background: `linear-gradient(135deg, ${colors.heroFrom} 0%, ${colors.heroTo} 100%)`,
          color: "#fff",
          overflow: "hidden",
          boxShadow: "0 18px 44px rgba(10, 22, 48, 0.24)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.65fr" },
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: colors.heroGlass,
                    border: `1px solid ${colors.heroGlassBorder}`,
                  }}
                >
                  <DashboardRoundedIcon fontSize="small" />
                </Box>

                <Typography
                  variant="overline"
                  sx={{ color: colors.heroMuted, letterSpacing: 1.2, fontWeight: 800 }}
                >
                  DASHBOARD RH
                </Typography>
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 34, md: 48 },
                  lineHeight: 1.05,
                  letterSpacing: -1,
                }}
              >
                Tablero principal de operación
              </Typography>

              <Typography
                sx={{
                  mt: 1.5,
                  color: colors.heroText,
                  maxWidth: 760,
                }}
              >
                Vista ejecutiva y operativa del módulo RH: empleados, sucursales,
                incidencias y actividad reciente.
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 2 }}
              >
                {normalizedRoles.length > 0 ? (
                  normalizedRoles.map((role) => (
                    <Chip
                      key={role}
                      label={role}
                      size="small"
                      sx={{
                        color: "#fff",
                        backgroundColor: colors.heroGlass,
                        border: `1px solid ${colors.heroGlassBorder}`,
                        fontWeight: 700,
                      }}
                    />
                  ))
                ) : (
                  <Chip
                    label="Sin roles detectados"
                    size="small"
                    sx={{
                      color: "#fff",
                      backgroundColor: colors.heroGlass,
                      border: `1px solid ${colors.heroGlassBorder}`,
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>
            </Box>

            <Box
              sx={{
                width: { xs: "100%", lg: 320 },
                justifySelf: { lg: "end" },
                p: 2.25,
                borderRadius: 5,
                border: `1px solid ${colors.heroGlassBorder}`,
                backgroundColor: colors.heroGlass,
                backdropFilter: "blur(8px)",
              }}
            >
              <Typography variant="body2" sx={{ color: colors.heroMuted, mb: 0.75 }}>
                Resumen rápido
              </Typography>

              <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1 }}>
                {quickActions.length}
              </Typography>

              <Typography variant="body2" sx={{ color: colors.heroText, mt: 0.75 }}>
                módulos disponibles para tu sesión actual
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PendingActionsOutlinedIcon />}
                  onClick={() => navigate("/incidencias")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 999,
                    backgroundColor: "#ffffff",
                    color: colors.text,
                    "&:hover": {
                      backgroundColor: "#f3f4f6",
                    },
                  }}
                >
                  Ver incidencias
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={refreshAll}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 999,
                    color: "#fff",
                    borderColor: colors.heroGlassBorder,
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.30)",
                      backgroundColor: alpha("#ffffff", 0.04),
                    },
                  }}
                >
                  Actualizar
                </Button>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {(statsQuery.isError || dashboardQuery.isError) && (
        <Stack spacing={1.5}>
          {statsQuery.isError && (
            <Alert severity="error">
              No se pudo cargar el resumen general.
              <br />
              {getQueryErrorMessage(
                statsQuery.error,
                "Error al consultar estadísticas generales."
              )}
            </Alert>
          )}

          {dashboardQuery.isError && (
            <Alert severity="error">
              No se pudo cargar el resumen de incidencias.
              <br />
              {getQueryErrorMessage(
                dashboardQuery.error,
                "Error al consultar incidencias."
              )}
            </Alert>
          )}
        </Stack>
      )}

      <SectionCard
        title="Accesos rápidos"
        subtitle="Atajos directos a los módulos más usados."
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
            gap: 1.25,
          }}
        >
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.to}
              label={action.label}
              description={action.description}
              icon={action.icon}
              onClick={() => navigate(action.to)}
            />
          ))}
        </Box>
      </SectionCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {primaryKpis.map((card) => (
          <PrimaryKpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            loading={statsQuery.isLoading || dashboardQuery.isLoading}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {miniStats.map((item) => (
          <MiniStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
            loading={statsQuery.isLoading}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <SummaryListCard
          title="Incidencias por tipo"
          subtitle="Qué clase de movimientos se están registrando."
          emptyText="No hay incidencias registradas en el mes."
          items={dashboardData?.incidenciasPorTipo ?? []}
          kind="tipo"
        />

        <SummaryListCard
          title="Incidencias por estatus"
          subtitle="Cómo va el flujo de revisión actual."
          emptyText="No hay incidencias registradas."
          items={dashboardData?.incidenciasPorEstatus ?? []}
          kind="estatus"
        />
      </Box>

      <SectionCard
        title="Incidencias recientes"
        subtitle="Últimos movimientos registrados en el módulo."
        action={
          <Button
            size="small"
            onClick={() => navigate("/incidencias")}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Ver todas
          </Button>
        }
      >
        {dashboardQuery.isLoading ? (
          <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : recientes.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.subtext }}>
            No hay incidencias recientes.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Número</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Estatus</strong></TableCell>
                  <TableCell><strong>Inicio</strong></TableCell>
                  <TableCell><strong>Fin</strong></TableCell>
                  <TableCell><strong>Creada</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recientes.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography fontWeight={700} sx={{ color: colors.text }}>
                          {item.empleadoNombre}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.subtext }}>
                          ID #{item.empleadoId}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>{item.numEmpleado}</TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            backgroundColor: colors.softBg,
                            color: colors.neutralIconText,
                            flexShrink: 0,
                          }}
                        >
                          {getTipoIcon(item.tipo)}
                        </Box>
                        <Typography variant="body2" sx={{ color: colors.text }}>
                          {formatEnumLabel(item.tipo)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={getStatusIcon(item.estatus)}
                        label={formatEnumLabel(item.estatus)}
                        size="small"
                        color={getStatusColor(item.estatus)}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>{formatDateOnly(item.fechaInicio)}</TableCell>
                    <TableCell>{formatDateOnly(item.fechaFin)}</TableCell>
                    <TableCell>{formatDateTime(item.createdAtUtc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </SectionCard>

      <SectionCard
        title="Auditoría reciente"
        subtitle="Actividad y trazabilidad del sistema."
      >
        {!canSeeAudit ? (
          <Alert severity="info">
            Tu rol actual no tiene acceso a la bitácora de auditoría.
          </Alert>
        ) : statsQuery.isLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : recentAudit.length === 0 ? (
          <Alert severity="info">No hay actividad reciente para mostrar.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {recentAudit.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                  gap: 1.5,
                  alignItems: "center",
                  px: 1.5,
                  py: 1.5,
                  borderRadius: 3,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.softBg2,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: colors.softBg,
                      color: colors.neutralIconText,
                      flexShrink: 0,
                    }}
                  >
                    {getActionIcon(row.action)}
                  </Box>

                  <Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography fontWeight={800} sx={{ color: colors.text }}>
                        {row.entityName || "Sistema"}
                      </Typography>

                      <Chip
                        size="small"
                        label={row.action}
                        color={getActionColor(row.action)}
                      />
                    </Stack>

                    <Typography variant="body2" sx={{ color: colors.subtext }}>
                      Usuario: {row.userEmail ?? "-"} · Rol: {row.userRole ?? "-"} ·
                      Registro: {row.recordId ?? "-"}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ textAlign: { md: "right" }, color: colors.subtext }}
                >
                  {formatDateTime(row.occurredAtUtc)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
}