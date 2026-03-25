import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import axios from "axios";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAuth } from "../features/auth/AuthContext";
import { api } from "../api/axios";
import {
  getDashboard,
  getDashboardStats,
  type DashboardCountBy,
  type DashboardData,
  type DashboardStats,
} from "../api/dashboard.api";
import { getUsers } from "../api/usuarios.api";

const dashboardTokens = {
  softSurface: "#f8fafc",
  softSurface2: "#fbfdff",
  borderSoft: "#e2e8f0",
  accent: "#1d4ed8",
  accentText: "#1e3a8a",
  progressBg: "#e8eef7",
  text: "#0f172a",
  subtext: "#64748b",
};

type QuickAction = {
  label: string;
  description: string;
  to: string;
  allow?: string[];
  icon: ReactNode;
};

type DashboardMetric = {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  badge?: string;
};

type AuditDisplayItem = {
  id?: number | string;
  occurredAtUtc?: string | null;
  action?: string | null;
  entityName?: string | null;
  recordId?: string | null;
  userEmail?: string | null;
};

type RecentIncidenciaItem = {
  id?: number | string;
  empleadoNombre?: string | null;
  comentario?: string | null;
  tipo?: string | null;
  estatus?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
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

  if (error instanceof Error) return error.message;
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
    case "PASSWORD_CHANGE":
      return "secondary";
    default:
      return "default";
  }
}

function getActionIcon(action: string): ReactElement {
  switch (action) {
    case "LOGIN":
    case "REFRESH":
    case "LOGOUT":
    case "LOGOUT_ALL":
    case "PASSWORD_CHANGE":
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

function getTipoIcon(tipo?: string | null): ReactElement {
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

function actionCardSx() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    p: 2,
    minHeight: 140,
    borderRadius: "22px",
    border: "1px solid",
    borderColor: "divider",
    backgroundColor: "background.paper",
    textDecoration: "none",
    color: "inherit",
    transition: "all .18s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
      borderColor: alpha("#1d4ed8", 0.18),
      backgroundColor: alpha("#1d4ed8", 0.02),
    },
  } as const;
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
    <SectionCard title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <Stack spacing={1.75}>
          {items.map((item) => {
            const progress = Math.max(8, Math.round((item.total / maxValue) * 100));
            const icon =
              kind === "tipo" ? getTipoIcon(item.nombre) : getStatusIcon(item.nombre);

            return (
              <Box
                key={`${title}-${item.nombre}`}
                sx={{
                  border: `1px solid ${dashboardTokens.borderSoft}`,
                  borderRadius: "18px",
                  p: 1.75,
                  backgroundColor: dashboardTokens.softSurface2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 1.1 }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: dashboardTokens.softSurface,
                        color: alpha(dashboardTokens.text, 0.75),
                        flexShrink: 0,
                        border: `1px solid ${alpha(dashboardTokens.text, 0.06)}`,
                      }}
                    >
                      {icon}
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: dashboardTokens.text,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatEnumLabel(item.nombre)}
                    </Typography>
                  </Stack>

                  <Chip
                    label={item.total}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 800,
                      color: dashboardTokens.accentText,
                      borderColor: alpha(dashboardTokens.accent, 0.16),
                      backgroundColor: alpha(dashboardTokens.accent, 0.05),
                    }}
                  />
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: dashboardTokens.progressBg,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: dashboardTokens.accent,
                      borderRadius: 999,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
}

async function getRecentAuditFallback(): Promise<AuditDisplayItem[]> {
  const { data } = await api.get("/api/Audit", {
    params: { page: 1, pageSize: 8 },
  });

  if (Array.isArray(data)) return data as AuditDisplayItem[];
  if (Array.isArray(data?.items)) return data.items as AuditDisplayItem[];
  if (Array.isArray(data?.data)) return data.data as AuditDisplayItem[];
  if (Array.isArray(data?.results)) return data.results as AuditDisplayItem[];

  return [];
}

export default function DashboardPage() {
  const { roles = [] } = useAuth();

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canSeeRhModules = canAccess(normalizedRoles, ["ADMIN", "RRHH"]);
  const canSeeAudit = canAccess(normalizedRoles, ["ADMIN", "RRHH"]);

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    enabled: canSeeRhModules || canSeeAudit,
  });

  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["dashboard-incidencias"],
    queryFn: getDashboard,
    enabled: canSeeRhModules,
  });

  const usersQuery = useQuery({
    queryKey: ["dashboard-users-total"],
    queryFn: () => getUsers({ page: 1, pageSize: 1 }),
    enabled: canSeeRhModules,
  });

  const auditFallbackQuery = useQuery<AuditDisplayItem[]>({
    queryKey: ["dashboard-audit-fallback"],
    queryFn: getRecentAuditFallback,
    enabled: canSeeAudit,
  });

  const statsData = statsQuery.data;
  const dashboardData = dashboardQuery.data;

  const recentAuditFromStats = Array.isArray((statsData as any)?.recentAudit)
    ? (((statsData as any).recentAudit as AuditDisplayItem[]) ?? [])
    : [];

  const recentAudit: AuditDisplayItem[] =
    recentAuditFromStats.length > 0
      ? recentAuditFromStats
      : auditFallbackQuery.data ?? [];

  const recientes = (dashboardData?.incidenciasRecientes ??
    []) as RecentIncidenciaItem[];

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
          label: "Usuarios",
          description: "Cuentas, roles y acceso al sistema.",
          to: "/usuarios",
          allow: ["ADMIN"],
          icon: <BadgeRoundedIcon fontSize="small" />,
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

  const primaryKpis: DashboardMetric[] = canSeeRhModules
    ? [
        {
          title: "Empleados activos",
          value: dashboardData?.empleadosActivos ?? 0,
          subtitle: "Personal activo registrado",
          icon: <Groups2OutlinedIcon fontSize="small" />,
          badge: "RH",
        },
        {
          title: "Sucursales activas",
          value: dashboardData?.sucursalesActivas ?? 0,
          subtitle: "Sedes disponibles",
          icon: <StoreRoundedIcon fontSize="small" />,
          badge: "RH",
        },
        {
          title: "Incidencias pendientes",
          value: dashboardData?.incidenciasPendientes ?? 0,
          subtitle: "Esperando revisión",
          icon: <PendingActionsOutlinedIcon fontSize="small" />,
          badge: "RH",
        },
        {
          title: "Incidencias del mes",
          value: dashboardData?.incidenciasMes ?? 0,
          subtitle: "Registradas en el mes actual",
          icon: <DashboardRoundedIcon fontSize="small" />,
          badge: "RH",
        },
      ]
    : [];

  const secondaryKpis: DashboardMetric[] = [
    ...(canSeeRhModules
      ? [
          {
            title: "Usuarios",
            value: usersQuery.data?.total ?? 0,
            subtitle: "Cuentas registradas",
            icon: <BadgeRoundedIcon fontSize="small" />,
            badge: "ADMIN",
          },
          {
            title: "Departamentos",
            value: statsData?.departamentosTotal ?? 0,
            subtitle: "Catálogo vigente",
            icon: <ApartmentRoundedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Puestos",
            value: statsData?.puestosTotal ?? 0,
            subtitle: "Roles y posiciones",
            icon: <WorkOutlineRoundedIcon fontSize="small" />,
            badge: "RH",
          },
        ]
      : []),
    ...(canSeeAudit
      ? [
          {
            title: "Auditoría",
            value: statsData?.auditoriaTotal ?? 0,
            subtitle: "Eventos registrados",
            icon: <GavelRoundedIcon fontSize="small" />,
            badge: "RH",
          },
        ]
      : []),
  ];

  const refreshAll = () => {
    if (canSeeRhModules) {
      void dashboardQuery.refetch();
      void usersQuery.refetch();
    }

    if (canSeeRhModules || canSeeAudit) {
      void statsQuery.refetch();
    }

    if (canSeeAudit) {
      void auditFallbackQuery.refetch();
    }
  };

  const primaryKpisLoading = canSeeRhModules && dashboardQuery.isLoading;
  const secondaryKpisLoading =
    (canSeeRhModules || canSeeAudit) &&
    (statsQuery.isLoading || (canSeeRhModules && usersQuery.isLoading));

  const auditLoading =
    (canSeeAudit && statsQuery.isLoading) ||
    (canSeeAudit &&
      recentAuditFromStats.length === 0 &&
      auditFallbackQuery.isLoading);

  const isRefreshing =
    (canSeeRhModules &&
      (dashboardQuery.isFetching || usersQuery.isFetching)) ||
    ((canSeeRhModules || canSeeAudit) && statsQuery.isFetching) ||
    (canSeeAudit && auditFallbackQuery.isFetching);

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Dashboard RH"
      subtitle="Panorama ejecutivo del módulo para revisar personal, incidencias, catálogos y actividad reciente."
      actions={
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Dashboard RH"
        title="Tablero principal de operación"
        subtitle="Vista ejecutiva y operativa del módulo RH: empleados, sucursales, incidencias, usuarios y actividad reciente."
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="Activo"
              size="small"
              variant="outlined"
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />
            {normalizedRoles.map((role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.18),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            ))}
          </Stack>
        }
        aside={
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {quickActions.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  módulos disponibles para tu sesión
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to="/incidencias"
                variant="contained"
                startIcon={<PendingActionsOutlinedIcon />}
                sx={{
                  fontWeight: 800,
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#1e40af",
                  },
                }}
              >
                Ver incidencias
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={refreshAll}
                disabled={isRefreshing}
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.2),
                  backgroundColor: alpha("#ffffff", 0.04),
                  "&:hover": {
                    borderColor: alpha("#ffffff", 0.32),
                    backgroundColor: alpha("#ffffff", 0.08),
                  },
                }}
              >
                Actualizar
              </Button>
            </Stack>
          </Stack>
        }
      />

      {(dashboardQuery.isError ||
        statsQuery.isError ||
        usersQuery.isError ||
        auditFallbackQuery.isError) && (
        <Stack spacing={1.5}>
          {dashboardQuery.isError && canSeeRhModules ? (
            <Alert severity="error">
              No se pudo cargar el resumen general.
              <br />
              {getQueryErrorMessage(
                dashboardQuery.error,
                "Error al consultar dashboard."
              )}
            </Alert>
          ) : null}

          {statsQuery.isError && (canSeeRhModules || canSeeAudit) ? (
            <Alert severity="error">
              No se pudo cargar el resumen estadístico.
              <br />
              {getQueryErrorMessage(
                statsQuery.error,
                "Error al consultar estadísticas."
              )}
            </Alert>
          ) : null}

          {usersQuery.isError && canSeeRhModules ? (
            <Alert severity="error">
              No se pudo cargar el resumen de usuarios.
              <br />
              {getQueryErrorMessage(
                usersQuery.error,
                "Error al consultar usuarios."
              )}
            </Alert>
          ) : null}

          {auditFallbackQuery.isError &&
          canSeeAudit &&
          recentAuditFromStats.length === 0 ? (
            <Alert severity="error">
              No se pudo cargar la actividad reciente de auditoría.
              <br />
              {getQueryErrorMessage(
                auditFallbackQuery.error,
                "Error al consultar auditoría reciente."
              )}
            </Alert>
          ) : null}
        </Stack>
      )}

      <SectionCard
        title="Indicadores principales"
        subtitle="KPIs operativos del módulo RH."
      >
        {primaryKpisLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },
              gap: { xs: 2, md: 2.25 },
            }}
          >
            {primaryKpis.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                icon={metric.icon}
                badge={metric.badge}
              />
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard
        title="Accesos rápidos"
        subtitle="Atajos directos a los módulos más usados."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={`${quickActions.length} módulo${
              quickActions.length === 1 ? "" : "s"
            } visible${quickActions.length === 1 ? "" : "s"}`}
          />
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {quickActions.map((action) => (
            <Box
              key={action.to}
              component={RouterLink}
              to={action.to}
              sx={actionCardSx()}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ color: "primary.main" }}
              >
                {action.icon}
                <Typography fontWeight={800}>{action.label}</Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {action.description}
              </Typography>

              <Box sx={{ mt: "auto" }}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={action.to}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </SectionCard>

      <SectionCard
        title="Resumen administrativo"
        subtitle="Catálogos, seguridad y trazabilidad del sistema."
      >
        {secondaryKpisLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : secondaryKpis.length === 0 ? (
          <Alert severity="info">
            No hay indicadores administrativos visibles para tu perfil.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },
              gap: { xs: 2, md: 2.25 },
            }}
          >
            {secondaryKpis.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                icon={metric.icon}
                badge={metric.badge}
              />
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard
        title="Actividad reciente"
        subtitle="Últimos eventos relevantes de auditoría del sistema."
        actions={
          canSeeAudit ? (
            <Button
              component={RouterLink}
              to="/audit"
              variant="outlined"
              size="small"
              startIcon={<GavelRoundedIcon />}
            >
              Ver auditoría
            </Button>
          ) : undefined
        }
      >
        {auditLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : recentAudit.length === 0 ? (
          <Alert severity="info">No hay actividad reciente para mostrar.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {recentAudit.slice(0, 8).map((item, index) => {
              const action = String(item.action ?? "EVENTO").toUpperCase();

              return (
                <Box
                  key={`${item.id ?? item.recordId ?? index}`}
                  sx={{
                    border: `1px solid ${dashboardTokens.borderSoft}`,
                    borderRadius: "18px",
                    p: 1.75,
                    backgroundColor: dashboardTokens.softSurface2,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          size="small"
                          color={getActionColor(action)}
                          icon={getActionIcon(action)}
                          label={formatEnumLabel(action)}
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />

                        <Typography variant="body2" fontWeight={700}>
                          {item.entityName ?? "Sistema"}
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Registro: {item.recordId ?? "-"} · Usuario:{" "}
                        {item.userEmail ?? "Sistema"}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {formatDateTime(item.occurredAtUtc)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </SectionCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 2,
        }}
      >
        <SummaryListCard
          title="Incidencias por tipo"
          subtitle="Distribución de incidencias registradas por categoría."
          emptyText="No hay datos de incidencias por tipo."
          items={dashboardData?.incidenciasPorTipo ?? []}
          kind="tipo"
        />

        <SummaryListCard
          title="Incidencias por estatus"
          subtitle="Comportamiento de revisión y resolución."
          emptyText="No hay datos de incidencias por estatus."
          items={dashboardData?.incidenciasPorEstatus ?? []}
          kind="estatus"
        />
      </Box>

      <SectionCard
        title="Incidencias recientes"
        subtitle="Últimos registros capturados en el módulo."
      >
        {dashboardQuery.isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : recientes.length === 0 ? (
          <Alert severity="info">No hay incidencias recientes para mostrar.</Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estatus</TableCell>
                  <TableCell>Desde</TableCell>
                  <TableCell>Hasta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recientes.slice(0, 8).map((item, index) => (
                  <TableRow key={item.id ?? index} hover>
                    <TableCell>
                      <Stack spacing={0.35}>
                        <Typography fontWeight={700}>
                          {item.empleadoNombre ?? "Sin nombre"}
                        </Typography>
                        {item.comentario ? (
                          <Typography variant="body2" color="text.secondary">
                            {item.comentario}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={getTipoIcon(item.tipo)}
                        label={formatEnumLabel(item.tipo)}
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        color={getStatusColor(item.estatus)}
                        icon={getStatusIcon(item.estatus)}
                        label={formatEnumLabel(item.estatus)}
                        variant="outlined"
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>

                    <TableCell>{formatDateOnly(item.fechaInicio)}</TableCell>
                    <TableCell>{formatDateOnly(item.fechaFin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </SectionCard>
    </AppPage>
  );
}