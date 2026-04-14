import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  type ChipProps,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";

import {
  getDashboardData,
  getDashboardStats,
  type DashboardData,
  type DashboardIncidenciaReciente,
  type DashboardStats,
} from "../api/dashboard.api";
import type { AuditItem } from "../api/audit.api";
import AppPage from "../components/ui/AppPage";

type KpiTone =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "secondary"
  | "error";

type QuickActionItem = {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
};

type SafeAuditItem = AuditItem & {
  id?: number | string;
  action?: string;
  entityName?: string;
  entity?: string;
  recordId?: number | string | null;
  entityId?: number | string | null;
  userEmail?: string;
  email?: string;
  userName?: string;
  userRole?: string;
  occurredAtUtc?: string;
  fecha?: string;
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getIncidenciaTone(estatus?: string | null): ChipProps["color"] {
  const normalized = (estatus ?? "").trim().toUpperCase();

  if (normalized === "APROBADA") return "success";
  if (normalized === "RECHAZADA") return "error";
  if (normalized === "PENDIENTE") return "warning";

  return "default";
}

function getAuditTone(action?: string | null): ChipProps["color"] {
  const normalized = (action ?? "").trim().toUpperCase();

  if (["LOGIN", "REFRESH", "LOGOUT", "LOGOUT_ALL"].includes(normalized)) {
    return "info";
  }
  if (["CREATE", "CREATED", "INSERT"].includes(normalized)) return "success";
  if (["UPDATE", "UPDATED", "EDIT"].includes(normalized)) return "warning";
  if (["DELETE", "SOFT_DELETE", "REMOVED"].includes(normalized)) return "error";
  if (["RESTORE", "RECOVER"].includes(normalized)) return "secondary";

  return "default";
}

function getAuditIcon(action?: string | null) {
  const normalized = (action ?? "").trim().toUpperCase();

  if (normalized === "LOGIN") return <LoginRoundedIcon fontSize="small" />;
  if (normalized === "REFRESH") return <RestartAltRoundedIcon fontSize="small" />;
  if (normalized === "LOGOUT" || normalized === "LOGOUT_ALL") {
    return <LogoutRoundedIcon fontSize="small" />;
  }
  if (["CREATE", "CREATED", "INSERT"].includes(normalized)) {
    return <AddCircleOutlineRoundedIcon fontSize="small" />;
  }
  if (["UPDATE", "UPDATED", "EDIT"].includes(normalized)) {
    return <EditRoundedIcon fontSize="small" />;
  }
  if (["DELETE", "SOFT_DELETE", "REMOVED"].includes(normalized)) {
    return <DeleteOutlineRoundedIcon fontSize="small" />;
  }
  if (["RESTORE", "RECOVER"].includes(normalized)) {
    return <RestoreRoundedIcon fontSize="small" />;
  }

  return <InfoOutlinedIcon fontSize="small" />;
}

function getAuditTitle(item: SafeAuditItem) {
  const action = (item.action ?? "MOVIMIENTO").toUpperCase();
  const entity = item.entityName ?? item.entity ?? "Sistema";
  return `${action} · ${entity}`;
}

function getAuditDescription(item: SafeAuditItem) {
  const user =
    item.userEmail ??
    item.email ??
    item.userName ??
    "Usuario sin identificar";

  const recordId = item.recordId ?? item.entityId;

  if (recordId !== undefined && recordId !== null && `${recordId}`.trim() !== "") {
    return `${user} · Registro ${recordId}`;
  }

  return user;
}

function getToneColors(theme: Theme, tone: KpiTone) {
  switch (tone) {
    case "success":
      return {
        main: theme.palette.success.main,
        soft: alpha(theme.palette.success.main, 0.14),
        border: alpha(theme.palette.success.main, 0.24),
      };
    case "warning":
      return {
        main: theme.palette.warning.main,
        soft: alpha(theme.palette.warning.main, 0.16),
        border: alpha(theme.palette.warning.main, 0.26),
      };
    case "info":
      return {
        main: theme.palette.info.main,
        soft: alpha(theme.palette.info.main, 0.16),
        border: alpha(theme.palette.info.main, 0.24),
      };
    case "secondary":
      return {
        main: theme.palette.secondary.main,
        soft: alpha(theme.palette.secondary.main, 0.16),
        border: alpha(theme.palette.secondary.main, 0.24),
      };
    case "error":
      return {
        main: theme.palette.error.main,
        soft: alpha(theme.palette.error.main, 0.14),
        border: alpha(theme.palette.error.main, 0.24),
      };
    case "primary":
    default:
      return {
        main: theme.palette.primary.main,
        soft: alpha(theme.palette.primary.main, 0.14),
        border: alpha(theme.palette.primary.main, 0.24),
      };
  }
}

function sectionCardSx(theme: Theme) {
  return {
    borderRadius: "14px",
    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
    background: `linear-gradient(180deg, ${alpha(
      theme.palette.background.paper,
      0.98
    )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    boxShadow: `0 10px 22px ${alpha(theme.palette.common.black, 0.05)}`,
  };
}

function innerCardSx(theme: Theme) {
  return {
    borderRadius: "12px",
    border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
    bgcolor: alpha(theme.palette.background.default, 0.48),
  };
}

function heroChipSx() {
  return {
    justifyContent: "flex-start",
    height: 34,
    borderRadius: "999px",
    bgcolor: alpha("#ffffff", 0.1),
    color: "#fff",
    border: `1px solid ${alpha("#ffffff", 0.12)}`,
    "& .MuiChip-icon": {
      color: "#fff",
      marginLeft: "8px",
    },
    "& .MuiChip-label": {
      px: 1,
      fontWeight: 700,
      fontSize: "0.8rem",
    },
  };
}

function softChipSx(color: string) {
  return {
    borderRadius: "999px",
    bgcolor: alpha(color, 0.1),
    color,
    border: `1px solid ${alpha(color, 0.18)}`,
    fontWeight: 800,
    "& .MuiChip-icon": {
      color,
    },
  };
}

function KpiCard({
  icon,
  label,
  value,
  subtitle,
  tone = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  subtitle: string;
  tone?: KpiTone;
}) {
  const theme = useTheme();
  const colors = getToneColors(theme, tone);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "12px",
        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        boxShadow: `0 8px 18px ${alpha(theme.palette.common.black, 0.045)}`,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            height: 3,
            background: `linear-gradient(90deg, ${colors.main} 0%, ${alpha(
              colors.main,
              0.2
            )} 100%)`,
          }}
        />
        <Stack spacing={1.25} sx={{ p: 1.8 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Avatar
              variant="rounded"
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: colors.soft,
                color: colors.main,
                border: `1px solid ${colors.border}`,
              }}
            >
              {icon}
            </Avatar>

            <Chip
              label={label}
              size="small"
              sx={{
                height: 24,
                borderRadius: "999px",
                bgcolor: alpha(colors.main, 0.08),
                color: colors.main,
                fontWeight: 700,
                border: `1px solid ${alpha(colors.main, 0.14)}`,
              }}
            />
          </Stack>

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {formatNumber(value)}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.7,
                color: "text.secondary",
                lineHeight: 1.45,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ item }: { item: QuickActionItem }) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      onClick={() => navigate(item.to)}
      sx={{
        cursor: "pointer",
        borderRadius: "12px",
        border: `1px solid ${alpha(theme.palette.divider, 0.82)}`,
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: `0 10px 18px ${alpha(theme.palette.primary.main, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      <CardContent sx={{ p: 1.4 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            {item.icon}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              {item.description}
            </Typography>
          </Box>

          <KeyboardArrowRightRoundedIcon color="action" />
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  const theme = useTheme();

  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: 168,
        borderRadius: "12px",
        border: `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
        bgcolor: alpha(theme.palette.action.hover, 0.35),
        px: 2.5,
        textAlign: "center",
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 46,
          height: 46,
          borderRadius: "10px",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        {icon}
      </Avatar>
      <Typography fontWeight={800}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {message}
      </Typography>
    </Stack>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsResponse, dashboardResponse] = await Promise.all([
        getDashboardStats(),
        getDashboardData(),
      ]);

      setStats(statsResponse);
      setDashboard(dashboardResponse);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el dashboard. Revisa la API o intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      {
        title: "Usuarios",
        description: "Altas, estado y control de acceso",
        to: "/usuarios",
        icon: <ManageAccountsRoundedIcon />,
      },
      {
        title: "Empleados",
        description: "Alta, consulta y control del padrón",
        to: "/empleados",
        icon: <Groups2RoundedIcon />,
      },
      {
        title: "Sucursales",
        description: "Gestión de sedes y operación",
        to: "/sucursales",
        icon: <StoreRoundedIcon />,
      },
      {
        title: "Departamentos",
        description: "Catálogo organizacional",
        to: "/departamentos",
        icon: <ApartmentRoundedIcon />,
      },
      {
        title: "Puestos",
        description: "Estructura de puestos y perfiles",
        to: "/puestos",
        icon: <BadgeRoundedIcon />,
      },
      {
        title: "Incidencias",
        description: "Seguimiento y aprobación operativa",
        to: "/incidencias",
        icon: <PendingActionsRoundedIcon />,
      },
      {
        title: "Vacantes",
        description: "Publicación y seguimiento de posiciones",
        to: "/reclutamiento/vacantes",
        icon: <WorkOutlineRoundedIcon />,
      },
      {
        title: "Candidatos",
        description: "Pipeline y evaluación de reclutamiento",
        to: "/reclutamiento/candidatos",
        icon: <PersonSearchRoundedIcon />,
      },
      {
        title: "Auditoría",
        description: "Trazabilidad y actividad reciente",
        to: "/audit",
        icon: <FactCheckRoundedIcon />,
      },
    ],
    []
  );

  const incidenciasPendientes = dashboard?.incidenciasPendientes ?? 0;
  const incidenciasMes = dashboard?.incidenciasMes ?? 0;
  const pendingProgress =
    incidenciasMes > 0
      ? Math.min(100, Math.round((incidenciasPendientes / incidenciasMes) * 100))
      : 0;

  const auditItems = (stats?.recentAudit ?? []) as SafeAuditItem[];
  const incidenciasRecientes: DashboardIncidenciaReciente[] = (
    dashboard?.incidenciasRecientes ?? []
  ).slice(0, 5);
  const incidenciasPorTipo = dashboard?.incidenciasPorTipo ?? [];
  const incidenciasPorEstatus = dashboard?.incidenciasPorEstatus ?? [];

  if (loading) {
    return (
      <AppPage>
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #0b1630 0%, #14233f 48%, #1d2c49 100%)",
            color: "common.white",
            minHeight: 200,
          }}
        >
          <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
            <Stack spacing={1.5}>
              <Chip
                label="Vista ejecutiva"
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: alpha("#ffffff", 0.14),
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "999px",
                }}
              />
              <Typography variant="h4" fontWeight={900}>
                Cargando panorama general...
              </Typography>
              <Typography sx={{ color: alpha("#ffffff", 0.78), maxWidth: 720 }}>
                Estamos armando tu tablero. No está roto; solo se está peinando.
              </Typography>
              <Box sx={{ pt: 1.5 }}>
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <Stack spacing={1.75}>
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            overflow: "hidden",
            color: "common.white",
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            background:
              "linear-gradient(135deg, #0b1630 0%, #14233f 48%, #1d2c49 100%)",
            boxShadow: `0 14px 28px ${alpha("#0b1630", 0.16)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.6}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.6}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ maxWidth: 820 }}>
                  <Chip
                    label="Vista ejecutiva"
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: alpha("#ffffff", 0.14),
                      color: "#fff",
                      fontWeight: 800,
                      border: `1px solid ${alpha("#ffffff", 0.16)}`,
                      borderRadius: "999px",
                    }}
                  />

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      lineHeight: 1.08,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    RH con vista premium
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mt: 0.9,
                      color: alpha("#ffffff", 0.78),
                      maxWidth: 760,
                      lineHeight: 1.55,
                    }}
                  >
                    Consulta rápido el estado general del sistema, catálogos,
                    incidencias y actividad reciente, sin volver esto un tablero
                    triste ni una dona inflada.
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "row", md: "column" }}
                  spacing={0.9}
                  sx={{ width: { xs: "100%", md: "auto" } }}
                >
                  <Button
                    variant="contained"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={() => void loadDashboard(true)}
                    disabled={refreshing}
                    sx={{
                      borderRadius: "10px",
                      px: 1.8,
                      py: 0.95,
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: "#fff",
                      color: "#10203d",
                      "&:hover": { bgcolor: alpha("#ffffff", 0.92) },
                    }}
                  >
                    {refreshing ? "Actualizando..." : "Actualizar"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RouteRoundedIcon />}
                    onClick={() => navigate("/incidencias")}
                    sx={{
                      borderRadius: "10px",
                      px: 1.8,
                      py: 0.95,
                      textTransform: "none",
                      fontWeight: 800,
                      color: "#fff",
                      borderColor: alpha("#ffffff", 0.26),
                      "&:hover": {
                        borderColor: alpha("#ffffff", 0.42),
                        bgcolor: alpha("#ffffff", 0.08),
                      },
                    }}
                  >
                    Ver incidencias
                  </Button>
                </Stack>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 0.9,
                }}
              >
                <Chip
                  icon={<Groups2RoundedIcon />}
                  label={`${formatNumber(dashboard?.empleadosActivos)} empleados activos`}
                  sx={heroChipSx()}
                />
                <Chip
                  icon={<StoreRoundedIcon />}
                  label={`${formatNumber(dashboard?.sucursalesActivas)} sucursales activas`}
                  sx={heroChipSx()}
                />
                <Chip
                  icon={<PendingActionsRoundedIcon />}
                  label={`${formatNumber(incidenciasPendientes)} incidencias pendientes`}
                  sx={heroChipSx()}
                />
                <Chip
                  icon={<HistoryRoundedIcon />}
                  label={`${formatNumber(stats?.auditoriaTotal)} eventos auditados`}
                  sx={heroChipSx()}
                />
              </Box>

              {refreshing && (
                <LinearProgress
                  sx={{
                    borderRadius: "999px",
                    bgcolor: alpha("#ffffff", 0.08),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: "999px",
                      bgcolor: "#fff",
                    },
                  }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
            },
            gap: 1.2,
          }}
        >
          <KpiCard
            icon={<Groups2RoundedIcon />}
            label="Empleados"
            value={stats?.empleadosTotal ?? 0}
            subtitle="Plantilla registrada en el sistema."
            tone="primary"
          />
          <KpiCard
            icon={<ApartmentRoundedIcon />}
            label="Departamentos"
            value={stats?.departamentosTotal ?? 0}
            subtitle="Catálogo organizacional disponible."
            tone="secondary"
          />
          <KpiCard
            icon={<BadgeRoundedIcon />}
            label="Puestos"
            value={stats?.puestosTotal ?? 0}
            subtitle="Posiciones configuradas y listas."
            tone="info"
          />
          <KpiCard
            icon={<StoreRoundedIcon />}
            label="Sucursales"
            value={stats?.sucursalesTotal ?? 0}
            subtitle="Centros de trabajo activos y operables."
            tone="success"
          />
          <KpiCard
            icon={<PendingActionsRoundedIcon />}
            label="Pendientes"
            value={incidenciasPendientes}
            subtitle="Incidencias esperando atención."
            tone="warning"
          />
          <KpiCard
            icon={<HistoryRoundedIcon />}
            label="Auditoría"
            value={stats?.auditoriaTotal ?? 0}
            subtitle="Movimientos con trazabilidad registrada."
            tone="error"
          />
        </Box>

        <Card elevation={0} sx={sectionCardSx(theme)}>
          <CardContent sx={{ p: 1.8 }}>
            <Stack spacing={1.35}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                spacing={0.9}
              >
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Accesos directos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entra rápido a los módulos que sí usas diario.
                  </Typography>
                </Box>

                <Chip
                  icon={<InsightsRoundedIcon />}
                  label="Navegación operativa"
                  sx={softChipSx(theme.palette.primary.main)}
                />
              </Stack>

              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                {quickActions.map((item) => (
                  <QuickActionCard key={item.to} item={item} />
                ))}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              xl: "1fr 1fr",
            },
            gap: 1.2,
            alignItems: "stretch",
          }}
        >
          <Card
            elevation={0}
            sx={{
              ...sectionCardSx(theme),
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 1.8,
                height: "100%",
              }}
            >
              <Stack spacing={1.35} sx={{ height: "100%" }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                  spacing={0.9}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Pulso de incidencias
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resumen operativo del mes y movimientos recientes.
                    </Typography>
                  </Box>

                  <Chip
                    icon={<CalendarMonthRoundedIcon />}
                    label={`${formatNumber(incidenciasMes)} registradas este mes`}
                    sx={softChipSx(theme.palette.warning.main)}
                  />
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 1,
                  }}
                >
                  <Card elevation={0} sx={innerCardSx(theme)}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack spacing={0.9}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography fontWeight={800}>
                            Presión pendiente
                          </Typography>
                          <Chip
                            size="small"
                            color="warning"
                            label={`${pendingProgress}%`}
                          />
                        </Stack>

                        <Typography variant="h5" fontWeight={900}>
                          {formatNumber(incidenciasPendientes)}
                        </Typography>

                        <LinearProgress
                          variant="determinate"
                          value={pendingProgress}
                          color="warning"
                          sx={{
                            height: 8,
                            borderRadius: "999px",
                            bgcolor: alpha(theme.palette.warning.main, 0.12),
                          }}
                        />

                        <Typography variant="body2" color="text.secondary">
                          Pendientes respecto al volumen del mes.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={innerCardSx(theme)}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack spacing={0.9}>
                        <Typography fontWeight={800}>Distribución por estatus</Typography>

                        <Stack direction="row" flexWrap="wrap" gap={0.7}>
                          {incidenciasPorEstatus.length > 0 ? (
                            incidenciasPorEstatus.map((item) => (
                              <Chip
                                key={`estatus-${item.nombre}`}
                                label={`${item.nombre}: ${formatNumber(item.total)}`}
                                color={getIncidenciaTone(item.nombre)}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin información disponible.
                            </Typography>
                          )}
                        </Stack>

                        <Divider sx={{ my: 0.1 }} />

                        <Typography fontWeight={800}>Distribución por tipo</Typography>

                        <Stack direction="row" flexWrap="wrap" gap={0.7}>
                          {incidenciasPorTipo.length > 0 ? (
                            incidenciasPorTipo.map((item) => (
                              <Chip
                                key={`tipo-${item.nombre}`}
                                label={`${item.nombre}: ${formatNumber(item.total)}`}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin información disponible.
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Divider />

                <Stack spacing={0.9} sx={{ flex: 1 }}>
                  <Typography fontWeight={900}>Incidencias recientes</Typography>

                  {incidenciasRecientes.length === 0 ? (
                    <EmptyState
                      icon={<AssignmentTurnedInRoundedIcon />}
                      title="Sin incidencias recientes"
                      message="Cuando se registren movimientos recientes, aquí aparecerá el resumen ejecutivo."
                    />
                  ) : (
                    incidenciasRecientes.map((item) => (
                      <Card key={item.id} elevation={0} sx={innerCardSx(theme)}>
                        <CardContent sx={{ p: 1.4 }}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", md: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Avatar
                                variant="rounded"
                                sx={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: "10px",
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: "primary.main",
                                }}
                              >
                                <PersonOutlineRoundedIcon />
                              </Avatar>

                              <Box>
                                <Typography fontWeight={800}>
                                  {item.empleadoNombre?.trim() || `Empleado #${item.empleadoId}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.numEmpleado} · {item.tipo}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.15 }}
                                >
                                  {formatDate(item.fechaInicio)}
                                  {item.fechaFin ? ` → ${formatDate(item.fechaFin)}` : ""}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack
                              direction={{ xs: "row", md: "column" }}
                              spacing={0.7}
                              alignItems={{ xs: "center", md: "flex-end" }}
                            >
                              <Chip
                                label={item.estatus}
                                color={getIncidenciaTone(item.estatus)}
                                sx={{ fontWeight: 800 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Alta: {formatDateTime(item.createdAtUtc)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              ...sectionCardSx(theme),
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 1.8,
                height: "100%",
              }}
            >
              <Stack spacing={1.35} sx={{ height: "100%" }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                  spacing={0.9}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Actividad reciente
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trazabilidad de eventos y movimientos relevantes.
                    </Typography>
                  </Box>

                  <Chip
                    icon={<FactCheckRoundedIcon />}
                    label={`${formatNumber(auditItems.length)} eventos visibles`}
                    sx={softChipSx(theme.palette.info.main)}
                  />
                </Stack>

                <Divider />

                {auditItems.length === 0 ? (
                  <EmptyState
                    icon={<HistoryRoundedIcon />}
                    title="Sin actividad reciente"
                    message="Cuando existan eventos auditables, aquí verás el rastro del sistema."
                  />
                ) : (
                  <Stack spacing={0.9} sx={{ flex: 1 }}>
                    {auditItems.map((item, index) => (
                      <Card
                        key={`${item.id ?? index}`}
                        elevation={0}
                        sx={innerCardSx(theme)}
                      >
                        <CardContent sx={{ p: 1.4 }}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", md: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Avatar
                                variant="rounded"
                                sx={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: "10px",
                                  bgcolor: alpha(theme.palette.info.main, 0.12),
                                  color: "info.main",
                                }}
                              >
                                {getAuditIcon(item.action)}
                              </Avatar>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography fontWeight={800}>
                                  {getAuditTitle(item)}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.15 }}
                                >
                                  {getAuditDescription(item)}
                                </Typography>

                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  flexWrap="wrap"
                                  useFlexGap
                                  sx={{ mt: 0.7 }}
                                >
                                  {item.userRole ? (
                                    <Chip
                                      size="small"
                                      label={item.userRole}
                                      variant="outlined"
                                      sx={{ fontWeight: 700 }}
                                    />
                                  ) : null}

                                  {item.entityName || item.entity ? (
                                    <Chip
                                      size="small"
                                      label={item.entityName ?? item.entity ?? "Sistema"}
                                      variant="outlined"
                                      sx={{ fontWeight: 700 }}
                                    />
                                  ) : null}
                                </Stack>
                              </Box>
                            </Stack>

                            <Stack
                              direction={{ xs: "row", md: "column" }}
                              spacing={0.7}
                              alignItems={{ xs: "center", md: "flex-end" }}
                              sx={{ flexShrink: 0 }}
                            >
                              <Chip
                                label={(item.action ?? "MOVIMIENTO").toUpperCase()}
                                color={getAuditTone(item.action)}
                                sx={{ fontWeight: 800 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(item.occurredAtUtc ?? item.fecha ?? null)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </AppPage>
  );
}