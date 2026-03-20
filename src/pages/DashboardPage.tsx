import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import ActionTile from "../components/ui/ActionTile";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  getDashboard,
  getDashboardStats,
  type DashboardCountBy,
  type DashboardData,
  type DashboardIncidenciaReciente,
  type DashboardStats,
} from "../api/dashboard.api";
import type { AuditItem } from "../api/audit.api";

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
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
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

  const primaryKpis: DashboardMetric[] = [
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
      icon: <EventNoteOutlinedIcon fontSize="small" />,
      badge: "RH",
    },
  ];

  const secondaryKpis: DashboardMetric[] = [
    {
      title: "Departamentos",
      value: statsData?.departamentosTotal ?? 0,
      subtitle: "Catálogo vigente",
      icon: <ApartmentRoundedIcon fontSize="small" />,
    },
    {
      title: "Puestos",
      value: statsData?.puestosTotal ?? 0,
      subtitle: "Roles y posiciones",
      icon: <WorkOutlineRoundedIcon fontSize="small" />,
    },
    {
      title: "Auditoría",
      value: canSeeAudit ? statsData?.auditoriaTotal ?? 0 : 0,
      subtitle: canSeeAudit ? "Eventos registrados" : "Sin acceso por rol actual",
      icon: <GavelRoundedIcon fontSize="small" />,
    },
  ];

  const refreshAll = () => {
    void statsQuery.refetch();
    void dashboardQuery.refetch();
  };

  const primaryKpisLoading = dashboardQuery.isLoading;
  const secondaryKpisLoading = statsQuery.isLoading;
  const isRefreshing = statsQuery.isFetching || dashboardQuery.isFetching;

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Dashboard RH"
      subtitle="Panorama ejecutivo del módulo para revisar personal, incidencias, catálogos y actividad reciente."
    >
      <HeroBanner
        eyebrow="Dashboard RH"
        title="Tablero principal de operación"
        subtitle="Vista ejecutiva y operativa del módulo RH: empleados, sucursales, incidencias y actividad reciente."
        badge="Activo"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role) => (
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
              ))
            ) : (
              <Chip
                label="Sin roles detectados"
                size="small"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.18),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        }
        aside={
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: alpha("#ffffff", 0.08),
                  border: `1px solid ${alpha("#ffffff", 0.12)}`,
                  flexShrink: 0,
                }}
              >
                <DashboardRoundedIcon fontSize="small" />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.76) }}>
                  Resumen rápido
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {quickActions.length}
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              módulos disponibles para tu sesión actual
            </Typography>

            <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<PendingActionsOutlinedIcon />}
                onClick={() => navigate("/incidencias")}
                sx={{
                  bgcolor: "#ffffff",
                  color: dashboardTokens.text,
                  "&:hover": {
                    bgcolor: "#f8fafc",
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
                  borderColor: alpha("#ffffff", 0.18),
                  "&:hover": {
                    borderColor: alpha("#ffffff", 0.28),
                    backgroundColor: alpha("#ffffff", 0.04),
                  },
                  "&.Mui-disabled": {
                    color: alpha("#ffffff", 0.5),
                    borderColor: alpha("#ffffff", 0.12),
                  },
                }}
              >
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Button>
            </Stack>
          </Stack>
        }
      />

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
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {quickActions.map((action) => (
            <ActionTile
              key={action.to}
              title={action.label}
              subtitle={action.description}
              icon={action.icon}
              to={action.to}
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
          gap: { xs: 2, md: 2.25 },
        }}
      >
        {primaryKpis.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={primaryKpisLoading ? "..." : formatNumber(item.value)}
            subtitle={primaryKpisLoading ? "Cargando información..." : item.subtitle}
            icon={item.icon}
            badge={item.badge}
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
          gap: { xs: 2, md: 2.25 },
        }}
      >
        {secondaryKpis.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={secondaryKpisLoading ? "..." : formatNumber(item.value)}
            subtitle={secondaryKpisLoading ? "Cargando información..." : item.subtitle}
            icon={item.icon}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: { xs: 2.25, md: 2.5 },
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
        actions={
          <Button size="small" onClick={() => navigate("/incidencias")}>
            Ver todas
          </Button>
        }
      >
        {dashboardQuery.isLoading ? (
          <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : recientes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
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
                        <Typography fontWeight={700} sx={{ color: dashboardTokens.text }}>
                          {item.empleadoNombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            backgroundColor: dashboardTokens.softSurface,
                            color: alpha(dashboardTokens.text, 0.75),
                            border: `1px solid ${alpha(dashboardTokens.text, 0.06)}`,
                            flexShrink: 0,
                          }}
                        >
                          {getTipoIcon(item.tipo)}
                        </Box>

                        <Typography variant="body2" sx={{ color: dashboardTokens.text }}>
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
          <Stack spacing={1.5}>
            {recentAudit.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                  gap: 1.5,
                  alignItems: "center",
                  px: 1.75,
                  py: 1.75,
                  borderRadius: "18px",
                  border: `1px solid ${dashboardTokens.borderSoft}`,
                  backgroundColor: dashboardTokens.softSurface2,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: dashboardTokens.softSurface,
                      color: alpha(dashboardTokens.text, 0.75),
                      border: `1px solid ${alpha(dashboardTokens.text, 0.06)}`,
                      flexShrink: 0,
                    }}
                  >
                    {getActionIcon(row.action)}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: dashboardTokens.text,
                          minWidth: 0,
                        }}
                      >
                        {row.entityName || "Sistema"}
                      </Typography>

                      <Chip
                        size="small"
                        label={row.action}
                        color={getActionColor(row.action)}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Usuario: {row.userEmail ?? "-"} · Rol: {row.userRole ?? "-"} ·
                      Registro: {row.recordId ?? "-"}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ textAlign: { md: "right" }, color: dashboardTokens.subtext }}
                >
                  {formatDateTime(row.occurredAtUtc)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </SectionCard>
    </AppPage>
  );
}