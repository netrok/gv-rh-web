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

function formatDate(value?: string | null) {
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

function ActionTile({
  primary,
  icon,
  title,
  subtitle,
  onClick,
}: {
  primary?: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      variant={primary ? "contained" : "outlined"}
      onClick={onClick}
      sx={{
        minHeight: 62,
        justifyContent: "flex-start",
        textAlign: "left",
        borderRadius: "14px",
        px: 1.35,
        py: 1.1,
        textTransform: "none",
        boxShadow: primary ? "0 8px 18px rgba(37, 99, 235, 0.18)" : "none",
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: primary ? alpha("#ffffff", 0.16) : "background.default",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={900} sx={{ lineHeight: 1.1 }}>
            {title}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              lineHeight: 1.25,
              color: primary ? alpha("#ffffff", 0.8) : "text.secondary",
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Button>
  );
}

function CompactLine({
  icon,
  title,
  value,
  helper,
  action,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
  helper: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.2,
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.25,
        py: 1.15,
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "12px",
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
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {title}
          </Typography>

          <Stack direction="row" spacing={0.7} alignItems="baseline">
            <Typography variant="h6" fontWeight={950} lineHeight={1}>
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {action}
    </Box>
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

  if (loading) {
    return (
      <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
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
          subtitle="Consulta tu expediente, vacaciones e incidencias desde un solo lugar."
          badge="Empleado"
          actions={
            <Button
              variant="contained"
              startIcon={
                refreshing ? (
                  <CircularProgress size={15} color="inherit" />
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

  const documentProgress =
    data.documentos.requeridos > 0
      ? Math.round((data.documentos.cargados / data.documentos.requeridos) * 100)
      : 100;

  const vacationBalance = vacacionesResumen?.saldoDisponible ?? 0;
  const vacationAnniversary = formatDate(vacacionesResumen?.proximoAniversario);

  return (
    <Stack spacing={{ xs: 1.75, md: 2 }} sx={{ pt: { xs: 0.5, md: 1 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          background:
            "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
          color: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 1.8, lg: 2.5 }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack spacing={0.95} sx={{ minWidth: 0 }}>
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

              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                useFlexGap
                alignItems="center"
              >
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

                {data.empleado.puestoNombre ? (
                  <Chip
                    size="small"
                    label={data.empleado.puestoNombre}
                    variant="outlined"
                    sx={{
                      color: "#ffffff",
                      borderColor: alpha("#ffffff", 0.22),
                      backgroundColor: alpha("#ffffff", 0.08),
                      fontWeight: 850,
                    }}
                  />
                ) : null}

                {data.empleado.departamentoNombre ? (
                  <Chip
                    size="small"
                    label={data.empleado.departamentoNombre}
                    variant="outlined"
                    sx={{
                      color: "#ffffff",
                      borderColor: alpha("#ffffff", 0.22),
                      backgroundColor: alpha("#ffffff", 0.08),
                      fontWeight: 850,
                    }}
                  />
                ) : null}

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
                      <CircularProgress size={15} color="inherit" />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                  onClick={() => void refreshAll()}
                  disabled={refreshing}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "primary.main",
                    minHeight: 26,
                    px: 1.15,
                    py: 0.25,
                    borderRadius: "9px",
                    fontSize: "0.76rem",
                    lineHeight: 1.15,
                    boxShadow: "none",
                    "& .MuiButton-startIcon": {
                      mr: 0.45,
                      "& svg": {
                        fontSize: 17,
                      },
                    },
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
          gap: { xs: 1.75, md: 2 },
          alignItems: "stretch",
        }}
      >
        <SectionCard title="Accesos rápidos" subtitle="Tus acciones principales.">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1,
            }}
          >
            <ActionTile
              primary
              icon={<FolderSharedRoundedIcon />}
              title="Mi expediente"
              subtitle="Documentos y datos"
              onClick={() => navigate(`/empleados/${data.empleado.id}/expediente`)}
            />

            <ActionTile
              icon={<BeachAccessRoundedIcon />}
              title="Mis vacaciones"
              subtitle="Saldo y solicitudes"
              onClick={() => navigate("/mis-vacaciones")}
            />

            <ActionTile
              icon={<FactCheckRoundedIcon />}
              title="Mis incidencias"
              subtitle="Historial personal"
              onClick={() => navigate("/incidencias")}
            />

            <ActionTile
              icon={<LockResetRoundedIcon />}
              title="Contraseña"
              subtitle="Seguridad de cuenta"
              onClick={() => navigate("/cambiar-password")}
            />
          </Box>
        </SectionCard>

        <SectionCard
          title="Estado general"
          subtitle="Documentos e incidencias en una vista breve."
        >
          <Stack spacing={1.15}>
            <CompactLine
              icon={<DescriptionRoundedIcon fontSize="small" />}
              title="Documentos"
              value={`${data.documentos.cargados}/${data.documentos.requeridos}`}
              helper={`${data.documentos.faltantes} faltante(s) · ${data.documentos.vencidos} vencido(s)`}
              action={
                <Chip
                  size="small"
                  color={data.documentos.completo ? "success" : "warning"}
                  variant="outlined"
                  label={data.documentos.completo ? "Al corriente" : "Atención"}
                  sx={{ fontWeight: 800 }}
                />
              }
            />

            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, documentProgress))}
              sx={{
                height: 7,
                borderRadius: 999,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                },
              }}
            />

            <CompactLine
              icon={<PendingActionsRoundedIcon fontSize="small" />}
              title="Incidencias"
              value={data.incidencias.total}
              helper={`${data.incidencias.pendientes} pendiente(s) · ${data.incidencias.aprobadas} aprobada(s)`}
              action={
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate("/incidencias")}
                  sx={{ fontWeight: 850 }}
                >
                  Ver
                </Button>
              }
            />
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard
        title="Mis vacaciones"
        subtitle="Saldo disponible, ciclo y solicitudes personales."
        actions={
          <Button
            size="small"
            variant="outlined"
            startIcon={<BeachAccessRoundedIcon />}
            onClick={() => navigate("/mis-vacaciones")}
            sx={{ borderRadius: "10px", fontWeight: 850 }}
          >
            Ver vacaciones
          </Button>
        }
      >
        {vacacionesLoading ? (
          <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : vacacionesError ? (
          <Alert severity="warning">{vacacionesError}</Alert>
        ) : (
          <Box
            sx={{
              px: { xs: 1.6, md: 1.85 },
              py: { xs: 1.5, md: 1.7 },
              borderRadius: "17px",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.09
                )}, ${alpha(theme.palette.primary.main, 0.025)})`,
            }}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", lg: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Saldo disponible
                </Typography>

                <Stack direction="row" spacing={0.9} alignItems="baseline">
                  <Typography
                    sx={{
                      fontSize: { xs: 38, md: 46 },
                      fontWeight: 950,
                      letterSpacing: "-0.055em",
                      lineHeight: 1,
                    }}
                  >
                    {formatDays(vacationBalance)}
                  </Typography>

                  <Typography color="text.secondary" fontWeight={900}>
                    días
                  </Typography>
                </Stack>
              </Box>

              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                useFlexGap
                alignItems="center"
              >
                <Chip
                  size="small"
                  icon={<TaskAltRoundedIcon />}
                  label={`${formatDays(vacacionesResumen?.diasTomadosTotal ?? 0)} tomados`}
                  variant="outlined"
                  sx={{ fontWeight: 850, bgcolor: "background.paper" }}
                />

                <Chip
                  size="small"
                  icon={<PendingActionsRoundedIcon />}
                  label={`${vacacionesResumen?.periodosAbiertos ?? 0} periodo(s) abierto(s)`}
                  variant="outlined"
                  sx={{ fontWeight: 850, bgcolor: "background.paper" }}
                />

                <Chip
                  size="small"
                  label={`Próximo aniversario: ${vacationAnniversary}`}
                  variant="outlined"
                  sx={{ fontWeight: 850, bgcolor: "background.paper" }}
                />
              </Stack>
            </Stack>

            {vacacionesResumen?.politicaNombre ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.2 }}
              >
                Política vigente: <strong>{vacacionesResumen.politicaNombre}</strong>
              </Typography>
            ) : null}
          </Box>
        )}
      </SectionCard>

      {(data.documentos.porVencer > 0 ||
        data.documentos.vencidos > 0 ||
        data.incidencias.rechazadas > 0) ? (
        <SectionCard title="Atención requerida" subtitle="Elementos que conviene revisar.">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {data.documentos.porVencer > 0 ? (
              <Chip
                icon={<WarningAmberRoundedIcon />}
                color="warning"
                variant="outlined"
                label={`${data.documentos.porVencer} documento(s) por vencer`}
                sx={{ fontWeight: 800 }}
              />
            ) : null}

            {data.documentos.vencidos > 0 ? (
              <Chip
                icon={<ErrorOutlineRoundedIcon />}
                color="error"
                variant="outlined"
                label={`${data.documentos.vencidos} documento(s) vencido(s)`}
                sx={{ fontWeight: 800 }}
              />
            ) : null}

            {data.incidencias.rechazadas > 0 ? (
              <Chip
                icon={<CancelRoundedIcon />}
                color="error"
                variant="outlined"
                label={`${data.incidencias.rechazadas} incidencia(s) rechazada(s)`}
                sx={{ fontWeight: 800 }}
              />
            ) : null}
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

