import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import FolderSharedRoundedIcon from "@mui/icons-material/FolderSharedRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";

import HeroBanner from "../ui/HeroBanner";
import MetricCard from "../ui/MetricCard";
import SectionCard from "../ui/SectionCard";
import { getMyDashboard, type MyDashboardData } from "../../api/dashboard.api";
import {
  getMisVacacionesResumen,
  type VacacionesResumen,
} from "../../api/vacaciones.api";

function getSafeErrorMessage(error: unknown) {
  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return (
    maybeAxiosError?.response?.data?.message ||
    maybeAxiosError?.message ||
    "No se pudo cargar tu panel personal."
  );
}

function formatVacationDashboardDate(value?: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDays(value?: number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
  }).format(numberValue);
}

function ProfileTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "14px",
        p: 1.45,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "11px",
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", lineHeight: 1.15 }}
          >
            {label}
          </Typography>

          <Typography
            fontWeight={850}
            sx={{
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={value || "No asignado"}
          >
            {value || "No asignado"}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function QuickActionButton({
  primary,
  icon,
  label,
  onClick,
}: {
  primary?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      variant={primary ? "contained" : "outlined"}
      startIcon={icon}
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        minHeight: 42,
        borderRadius: "12px",
        px: 1.5,
        fontWeight: 850,
        boxShadow: primary ? "0 8px 20px rgba(37, 99, 235, 0.2)" : "none",
      }}
    >
      {label}
    </Button>
  );
}

function VacationSummaryCard({
  resumen,
  loading,
  error,
  onViewRequests,
}: {
  resumen: VacacionesResumen | null;
  loading: boolean;
  error: string | null;
  onViewRequests: () => void;
}) {
  return (
    <SectionCard
      title="Mis vacaciones"
      subtitle="Saldo disponible y próximos datos clave."
      actions={
        <Button
          size="small"
          variant="outlined"
          startIcon={<BeachAccessRoundedIcon />}
          onClick={onViewRequests}
          sx={{ borderRadius: "10px", fontWeight: 800 }}
        >
          Ver solicitudes
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress size={26} />
        </Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : resumen ? (
        <Stack spacing={1.6}>
          <Box
            sx={{
              p: 2,
              borderRadius: "18px",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.08
                )}, ${alpha(theme.palette.primary.main, 0.025)})`,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Saldo disponible
                </Typography>

                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 950,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {formatDays(resumen.saldoDisponible)}
                  </Typography>

                  <Typography color="text.secondary" fontWeight={800}>
                    días
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                  Días pendientes de disfrutar.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  icon={<TaskAltRoundedIcon />}
                  label={`${formatDays(resumen.diasTomadosTotal)} tomados`}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />

                <Chip
                  size="small"
                  icon={<PendingActionsRoundedIcon />}
                  label={`${resumen.periodosAbiertos ?? 0} periodo(s) abierto(s)`}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            </Stack>
          </Box>

          <Alert
            severity="info"
            sx={{
              borderRadius: "14px",
              "& .MuiAlert-message": {
                fontSize: 13,
              },
            }}
          >
            Próximo aniversario:{" "}
            <strong>
              {formatVacationDashboardDate(resumen.proximoAniversario)}
            </strong>
            {resumen.politicaNombre ? ` · Política: ${resumen.politicaNombre}` : ""}
          </Alert>
        </Stack>
      ) : (
        <Alert severity="info">No hay información de vacaciones disponible.</Alert>
      )}
    </SectionCard>
  );
}

export default function EmpleadoDashboardView() {
  const navigate = useNavigate();

  const [data, setData] = useState<MyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vacacionesResumen, setVacacionesResumen] =
    useState<VacacionesResumen | null>(null);
  const [vacacionesLoading, setVacacionesLoading] = useState(true);
  const [vacacionesError, setVacacionesError] = useState<string | null>(null);

  async function loadData(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getMyDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Error cargando mi dashboard:", err);
      setError(getSafeErrorMessage(err));
      setData(null);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function loadVacacionesResumen() {
    try {
      setVacacionesLoading(true);
      setVacacionesError(null);

      const resumen = await getMisVacacionesResumen();
      setVacacionesResumen(resumen);
    } catch (err) {
      console.error("Error cargando resumen de vacaciones:", err);
      setVacacionesError("No se pudo cargar tu resumen de vacaciones.");
    } finally {
      setVacacionesLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadData(true), loadVacacionesResumen()]);
  }

  useEffect(() => {
    void loadData();
    void loadVacacionesResumen();
  }, []);

  const documentProgress =
    data && data.documentos.requeridos > 0
      ? Math.round((data.documentos.cargados / data.documentos.requeridos) * 100)
      : 100;


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Cargando tu panel personal...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Stack spacing={2}>
        <HeroBanner
          eyebrow="Panel personal"
          title="Mi espacio RH"
          subtitle="Consulta tu información, estado documental e incidencias desde un solo lugar."
          badge="Empleado"
          actions={
            <Button
              variant="contained"
              startIcon={
                refreshing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              onClick={() => void loadData(true)}
              disabled={refreshing}
              sx={{
                bgcolor: "#ffffff",
                color: "primary.main",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.92),
                },
              }}
            >
              {refreshing ? "Actualizando..." : "Reintentar"}
            </Button>
          }
          aside={
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
                Estado
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                —
              </Typography>

              <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
                No fue posible cargar tu resumen personal.
              </Typography>
            </Stack>
          }
        />

        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadData(true)}
              disabled={refreshing}
            >
              Reintentar
            </Button>
          }
        >
          {error || "No se pudo cargar tu panel personal."}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.25 }} sx={{ pt: { xs: 0.5, md: 1 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "22px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          boxShadow: "0 16px 38px rgba(15, 23, 42, 0.07)",
          background:
            "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
          color: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 2, lg: 3 }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack spacing={1.15} sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  color: alpha("#ffffff", 0.72),
                  fontWeight: 900,
                  letterSpacing: 1.1,
                }}
              >
                Panel personal
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 950,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  maxWidth: 820,
                }}
              >
                Hola, {data.empleado.nombreCompleto}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={data.empleado.activo ? "Activo" : "Inactivo"}
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.22),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 850,
                  }}
                />

                <Chip
                  size="small"
                  label={`# ${data.empleado.numEmpleado}`}
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.22),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 850,
                  }}
                />

                {data.empleado.sucursalNombre ? (
                  <Chip
                    size="small"
                    label={data.empleado.sucursalNombre}
                    variant="outlined"
                    sx={{
                      color: "#ffffff",
                      borderColor: alpha("#ffffff", 0.22),
                      backgroundColor: alpha("#ffffff", 0.08),
                      fontWeight: 850,
                    }}
                  />
                ) : null}

                <Button
                  variant="contained"
                  startIcon={
                    refreshing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                  onClick={() => void refreshAll()}
                  disabled={refreshing}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "primary.main",
                    minHeight: 32,
                    px: 1.6,
                    borderRadius: "10px",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: alpha("#ffffff", 0.92),
                      boxShadow: "none",
                    },
                  }}
                >
                  {refreshing ? "Actualizando..." : "Actualizar"}
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                width: { xs: "100%", lg: 300 },
                borderRadius: "18px",
                border: "1px solid",
                borderColor: alpha("#ffffff", 0.14),
                bgcolor: alpha("#ffffff", 0.08),
                p: 1.8,
                backdropFilter: "blur(10px)",
                flexShrink: 0,
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
                  Resumen rápido
                </Typography>

                <Stack direction="row" spacing={2.2}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      {data.documentos.cargados}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                      documentos
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      {formatDays(vacacionesResumen?.saldoDisponible ?? 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                      vacaciones
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      {documentProgress}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                      avance
                    </Typography>
                  </Box>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, documentProgress))}
                  sx={{
                    height: 7,
                    borderRadius: 999,
                    bgcolor: alpha("#ffffff", 0.16),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      bgcolor: "#ffffff",
                    },
                  }}
                />

                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
                  Tu estado documental y vacaciones en una vista compacta.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>



      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1.05fr 0.95fr",
          },
          gap: { xs: 2, md: 2.2 },
          alignItems: "stretch",
        }}
      >
        <SectionCard
          title="Mi perfil"
          subtitle="Información laboral vinculada a tu cuenta."
          actions={
            <Chip
              size="small"
              variant="outlined"
              color={data.empleado.activo ? "success" : "default"}
              label={data.empleado.activo ? "Empleado activo" : "Empleado inactivo"}
            />
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 1.25,
            }}
          >
            <ProfileTile
              label="Número de empleado"
              value={data.empleado.numEmpleado}
              icon={<BadgeRoundedIcon fontSize="small" />}
            />

            <ProfileTile
              label="Puesto"
              value={data.empleado.puestoNombre}
              icon={<BusinessCenterRoundedIcon fontSize="small" />}
            />

            <ProfileTile
              label="Departamento"
              value={data.empleado.departamentoNombre}
              icon={<ApartmentRoundedIcon fontSize="small" />}
            />

            <ProfileTile
              label="Sucursal"
              value={data.empleado.sucursalNombre}
              icon={<StoreRoundedIcon fontSize="small" />}
            />
          </Box>
        </SectionCard>

        <SectionCard
          title="Accesos directos"
          subtitle="Funciones principales de tu cuenta."
        >
          <Stack spacing={1}>
            <QuickActionButton
              primary
              icon={<FolderSharedRoundedIcon />}
              label="Mi expediente"
              onClick={() => navigate(`/empleados/${data.empleado.id}/expediente`)}
            />

            <QuickActionButton
              icon={<BeachAccessRoundedIcon />}
              label="Mis vacaciones"
              onClick={() => navigate("/mis-vacaciones")}
            />

            <QuickActionButton
              icon={<FactCheckRoundedIcon />}
              label="Mis incidencias"
              onClick={() => navigate("/incidencias")}
            />

            <QuickActionButton
              icon={<LockResetRoundedIcon />}
              label="Cambiar contraseña"
              onClick={() => navigate("/cambiar-password")}
            />

            <Alert
              severity="info"
              sx={{
                mt: 0.4,
                borderRadius: "12px",
                "& .MuiAlert-message": {
                  fontSize: 13,
                },
              }}
            >
              Tu panel muestra solo información personal.
            </Alert>
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1fr 1fr",
          },
          gap: { xs: 2, md: 2.2 },
        }}
      >
        <VacationSummaryCard
          resumen={vacacionesResumen}
          loading={vacacionesLoading}
          error={vacacionesError}
          onViewRequests={() => navigate("/mis-vacaciones")}
        />

        <SectionCard
          title="Mis documentos"
          subtitle="Estado de tus documentos requeridos."
          actions={
            <Chip
              size="small"
              color={data.documentos.completo ? "success" : "warning"}
              variant="outlined"
              label={data.documentos.completo ? "Al corriente" : "Requiere atención"}
            />
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 1.35,
            }}
          >
            <MetricCard
              title="Cargados"
              value={data.documentos.cargados}
              subtitle={`de ${data.documentos.requeridos} requeridos`}
              icon={<DescriptionRoundedIcon fontSize="small" />}
            />

            <MetricCard
              title="Faltantes"
              value={data.documentos.faltantes}
              subtitle="Pendientes por subir"
              icon={<FolderSharedRoundedIcon fontSize="small" />}
            />

            <MetricCard
              title="Por vencer"
              value={data.documentos.porVencer}
              subtitle="Vigencias próximas"
              icon={<WarningAmberRoundedIcon fontSize="small" />}
            />

            <MetricCard
              title="Vencidos"
              value={data.documentos.vencidos}
              subtitle="Requieren actualización"
              icon={<ErrorOutlineRoundedIcon fontSize="small" />}
            />
          </Box>
        </SectionCard>
      </Box>

      <SectionCard
        title="Mis incidencias"
        subtitle="Resumen de tus registros e incidencias."
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 1.35,
          }}
        >
          <MetricCard
            title="Pendientes"
            value={data.incidencias.pendientes}
            subtitle="En revisión"
            icon={<PendingActionsRoundedIcon fontSize="small" />}
          />

          <MetricCard
            title="Aprobadas"
            value={data.incidencias.aprobadas}
            subtitle="Aceptadas"
            icon={<TaskAltRoundedIcon fontSize="small" />}
          />

          <MetricCard
            title="Rechazadas"
            value={data.incidencias.rechazadas}
            subtitle="No autorizadas"
            icon={<CancelRoundedIcon fontSize="small" />}
          />
        </Box>
      </SectionCard>
    </Stack>
  );
}

