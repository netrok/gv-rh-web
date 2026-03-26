import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAuth } from "../features/auth/AuthContext";
import { api } from "../api/axios";
import {
  getDashboard,
  getDashboardDocumentosResumen,
  getDashboardStats,
  type DashboardCountBy,
  type DashboardData,
  type DashboardDocumentosResumen,
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
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTotal(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  if (!isRecord(payload)) return 0;

  const total = payload.total;
  if (typeof total === "number") return total;

  const totalCount = payload.totalCount;
  if (typeof totalCount === "number") return totalCount;

  const count = payload.count;
  if (typeof count === "number") return count;

  const items = payload.items;
  if (Array.isArray(items)) return items.length;

  const data = payload.data;
  if (Array.isArray(data)) return data.length;

  return 0;
}

function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.response?.data?.error;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function getActionIcon(action?: string | null): ReactElement {
  switch ((action ?? "").toUpperCase()) {
    case "CREATE":
      return <CheckCircleRoundedIcon fontSize="small" />;
    case "UPDATE":
      return <EditNoteRoundedIcon fontSize="small" />;
    case "DELETE":
      return <DeleteOutlineRoundedIcon fontSize="small" />;
    case "RESTORE":
      return <RestoreRoundedIcon fontSize="small" />;
    case "LOGIN":
      return <LoginRoundedIcon fontSize="small" />;
    case "REFRESH":
      return <RefreshRoundedIcon fontSize="small" />;
    default:
      return <SecurityRoundedIcon fontSize="small" />;
  }
}

function getActionColor(
  action?: string | null
): "success" | "warning" | "error" | "info" | "default" {
  switch ((action ?? "").toUpperCase()) {
    case "CREATE":
    case "RESTORE":
      return "success";
    case "UPDATE":
    case "REFRESH":
      return "info";
    case "DELETE":
      return "error";
    case "LOGIN":
      return "default";
    default:
      return "default";
  }
}

function getStatusIcon(value?: string | null): ReactElement {
  switch ((value ?? "").toUpperCase()) {
    case "PENDIENTE":
      return <HourglassTopRoundedIcon fontSize="small" />;
    case "APROBADA":
      return <CheckCircleRoundedIcon fontSize="small" />;
    case "RECHAZADA":
      return <CancelRoundedIcon fontSize="small" />;
    default:
      return <AssessmentRoundedIcon fontSize="small" />;
  }
}

function getIncidenciaStatusChipColor(
  value?: string | null
): "default" | "success" | "warning" | "error" {
  switch ((value ?? "").toUpperCase()) {
    case "PENDIENTE":
      return "warning";
    case "APROBADA":
      return "success";
    case "RECHAZADA":
      return "error";
    default:
      return "default";
  }
}

function getTipoIcon(value?: string | null): ReactElement {
  switch ((value ?? "").toUpperCase()) {
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

function getIncidenciaTipoChipColor(
  value?: string | null
): "default" | "success" | "warning" | "error" | "info" {
  switch ((value ?? "").toUpperCase()) {
    case "RETARDO":
      return "warning";
    case "FALTA":
      return "error";
    case "PERMISO":
      return "info";
    case "VACACIONES":
      return "success";
    case "INCAPACIDAD":
      return "success";
    case "OMISION_DE_CHECADA":
      return "default";
    default:
      return "default";
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
  if (Array.isArray((data as any)?.items)) return (data as any).items as AuditDisplayItem[];
  if (Array.isArray((data as any)?.data)) return (data as any).data as AuditDisplayItem[];
  if (Array.isArray((data as any)?.results)) return (data as any).results as AuditDisplayItem[];

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

  const usersQuery = useQuery<unknown>({
    queryKey: ["dashboard-users-total"],
    queryFn: () => getUsers({ page: 1, pageSize: 1 }),
    enabled: canSeeRhModules,
  });

  const documentosQuery = useQuery<DashboardDocumentosResumen>({
    queryKey: ["dashboard-documentos"],
    queryFn: getDashboardDocumentosResumen,
    enabled: canSeeRhModules,
  });

  const auditFallbackQuery = useQuery<AuditDisplayItem[]>({
    queryKey: ["dashboard-audit-fallback"],
    queryFn: getRecentAuditFallback,
    enabled: canSeeAudit,
  });

  const statsData = statsQuery.data;
  const dashboardData = dashboardQuery.data;
  const documentosData = documentosQuery.data;

  const recentAuditFromStats = Array.isArray((statsData as any)?.recentAudit)
    ? (((statsData as any).recentAudit as AuditDisplayItem[]) ?? [])
    : [];

  const recentAudit: AuditDisplayItem[] =
    recentAuditFromStats.length > 0
      ? recentAuditFromStats
      : auditFallbackQuery.data ?? [];

  const recientes = (dashboardData?.incidenciasRecientes ?? []) as RecentIncidenciaItem[];

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

  const primaryKpis: DashboardMetric[] = [
    ...(canSeeRhModules
      ? [
          {
            title: "Empleados activos",
            value: dashboardData?.empleadosActivos ?? 0,
            subtitle: "Personal vigente",
            icon: <Groups2OutlinedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Incidencias pendientes",
            value: dashboardData?.incidenciasPendientes ?? 0,
            subtitle: "Atención requerida",
            icon: <PendingActionsOutlinedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Incidencias del mes",
            value: dashboardData?.incidenciasMes ?? 0,
            subtitle: "Movimiento del periodo",
            icon: <AssessmentRoundedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Expedientes incompletos",
            value: documentosData?.expedientesIncompletos ?? 0,
            subtitle: "Documentación pendiente",
            icon: <FolderOpenRoundedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Docs por vencer",
            value: documentosData?.documentosPorVencer ?? 0,
            subtitle: "Próximos 30 días",
            icon: <DescriptionRoundedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Docs vencidos",
            value: documentosData?.documentosVencidos ?? 0,
            subtitle: "Requieren actualización",
            icon: <WarningAmberRoundedIcon fontSize="small" />,
            badge: "RH",
          },
        ]
      : []),
  ];

  const secondaryKpis: DashboardMetric[] = [
    ...(canSeeRhModules
      ? [
          {
            title: "Usuarios",
            value: extractTotal(usersQuery.data),
            subtitle: "Cuentas registradas",
            icon: <BadgeRoundedIcon fontSize="small" />,
            badge: "RH",
          },
          {
            title: "Sucursales",
            value: statsData?.sucursalesTotal ?? 0,
            subtitle: "Cobertura operativa",
            icon: <StoreRoundedIcon fontSize="small" />,
            badge: "RH",
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
          {
            title: "Expedientes completos",
            value: documentosData?.totalEmpleadosActivos
              ? Math.max(
                  0,
                  documentosData.totalEmpleadosActivos - documentosData.expedientesIncompletos
                )
              : 0,
            subtitle: "Cumplimiento documental",
            icon: <TaskAltRoundedIcon fontSize="small" />,
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
      void documentosQuery.refetch();
    }

    if (canSeeRhModules || canSeeAudit) {
      void statsQuery.refetch();
    }

    if (canSeeAudit) {
      void auditFallbackQuery.refetch();
    }
  };

  const primaryKpisLoading =
    canSeeRhModules && (dashboardQuery.isLoading || documentosQuery.isLoading);

  const secondaryKpisLoading =
    (canSeeRhModules || canSeeAudit) &&
    (statsQuery.isLoading ||
      (canSeeRhModules && usersQuery.isLoading) ||
      (canSeeRhModules && documentosQuery.isLoading));

  const auditLoading =
    (canSeeAudit && statsQuery.isLoading) ||
    (canSeeAudit &&
      recentAuditFromStats.length === 0 &&
      auditFallbackQuery.isLoading);

  const isRefreshing =
    (canSeeRhModules &&
      (dashboardQuery.isFetching ||
        usersQuery.isFetching ||
        documentosQuery.isFetching)) ||
    ((canSeeRhModules || canSeeAudit) && statsQuery.isFetching) ||
    (canSeeAudit && auditFallbackQuery.isFetching);

  const hasError =
    dashboardQuery.isError ||
    statsQuery.isError ||
    usersQuery.isError ||
    documentosQuery.isError ||
    auditFallbackQuery.isError;

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Dashboard RH"
      subtitle="Panorama ejecutivo del módulo para revisar personal, incidencias, catálogos, documentos y actividad reciente."
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
        subtitle="Vista ejecutiva y operativa del módulo RH: empleados, sucursales, incidencias, usuarios, documentos y actividad reciente."
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

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {documentosData?.expedientesIncompletos ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  expedientes incompletos
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

      {hasError && (
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

          {documentosQuery.isError && canSeeRhModules ? (
            <Alert severity="error">
              No se pudo cargar el resumen documental.
              <br />
              {getQueryErrorMessage(
                documentosQuery.error,
                "Error al consultar documentos."
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
        ) : primaryKpis.length === 0 ? (
          <Alert severity="info">
            No hay indicadores principales visibles para tu perfil.
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
        subtitle="Catálogos, seguridad, trazabilidad y documentación del sistema."
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
        title="Alertas documentales"
        subtitle="Empleados con expediente incompleto, documentos por vencer o vencidos."
        actions={
          canSeeRhModules ? (
            <Button
              component={RouterLink}
              to="/empleados"
              variant="outlined"
              size="small"
              startIcon={<FolderOpenRoundedIcon />}
            >
              Ver empleados
            </Button>
          ) : undefined
        }
      >
        {documentosQuery.isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : !documentosData || documentosData.alertas.length === 0 ? (
          <Alert severity="info">
            No hay alertas documentales activas por el momento.
          </Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Faltantes</TableCell>
                  <TableCell>Por vencer</TableCell>
                  <TableCell>Vencidos</TableCell>
                  <TableCell>Cumplimiento</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentosData.alertas.map((item) => (
                  <TableRow key={`doc-alert-${item.empleadoId}`} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography fontWeight={800}>
                          {item.nombreEmpleado}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.numEmpleado}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={<ApartmentRoundedIcon fontSize="small" />}
                        label={item.departamentoNombre ?? "-"}
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={<DescriptionRoundedIcon fontSize="small" />}
                        label={item.totalFaltantes}
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={<HourglassBottomRoundedIcon fontSize="small" />}
                        label={item.totalPorVencer}
                        color="warning"
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={<WarningAmberRoundedIcon fontSize="small" />}
                        label={item.totalVencidos}
                        color="error"
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.75}>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                        >
                          <ChecklistRoundedIcon
                            fontSize="small"
                            sx={{ color: dashboardTokens.accent }}
                          />
                          <Typography variant="body2" fontWeight={800}>
                            {item.porcentajeCumplimiento.toFixed(
                              item.porcentajeCumplimiento % 1 === 0 ? 0 : 2
                            )}
                            %
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(
                            0,
                            Math.min(100, Number(item.porcentajeCumplimiento))
                          )}
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
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/empleados/${item.empleadoId}/expediente`}
                      >
                        Expediente
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                          sx={{
                            fontWeight: 800,
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />

                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<InfoOutlinedIcon fontSize="small" />}
                          label={item.entityName ?? "Entidad"}
                          sx={{
                            fontWeight: 700,
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />

                        <Typography variant="body2" color="text.secondary">
                          #{item.recordId ?? "-"}
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {item.userEmail ?? "Sistema"} •{" "}
                        {formatDateTime(item.occurredAtUtc)}
                      </Typography>
                    </Stack>
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
          gap: 2.25,
        }}
      >
        <SummaryListCard
          title="Incidencias por tipo"
          subtitle="Distribución de registros según su clasificación."
          items={dashboardData?.incidenciasPorTipo ?? []}
          emptyText="No hay datos de incidencias por tipo."
          kind="tipo"
        />

        <SummaryListCard
          title="Incidencias por estatus"
          subtitle="Panorama de seguimiento del flujo de incidencias."
          items={dashboardData?.incidenciasPorEstatus ?? []}
          emptyText="No hay datos de incidencias por estatus."
          kind="estatus"
        />
      </Box>

      <SectionCard
        title="Incidencias recientes"
        subtitle="Últimos movimientos registrados en el módulo de incidencias."
        actions={
          canSeeRhModules ? (
            <Button
              component={RouterLink}
              to="/incidencias"
              variant="outlined"
              size="small"
              startIcon={<PendingActionsOutlinedIcon />}
            >
              Ver incidencias
            </Button>
          ) : undefined
        }
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
                  <TableCell>Fecha inicio</TableCell>
                  <TableCell>Fecha fin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recientes.map((item, index) => (
                  <TableRow key={`inc-${item.id ?? index}`} hover>
                    <TableCell>
                      <Typography fontWeight={800}>
                        {item.empleadoNombre ?? "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={getTipoIcon(item.tipo)}
                        label={formatEnumLabel(item.tipo)}
                        color={getIncidenciaTipoChipColor(item.tipo)}
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": {
                            color: "inherit",
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        icon={getStatusIcon(item.estatus)}
                        label={formatEnumLabel(item.estatus)}
                        color={getIncidenciaStatusChipColor(item.estatus)}
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          "& .MuiChip-icon": {
                            color: "inherit",
                          },
                        }}
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