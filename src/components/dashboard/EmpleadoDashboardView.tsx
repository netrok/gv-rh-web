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

function SmallDataPill({
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
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: 0,
        px: 1.2,
        py: 1,
        borderRadius: "13px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "primary.main",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.1 }}
        >
          {label}
        </Typography>

        <Typography
          fontWeight={900}
          sx={{
            lineHeight: 1.15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={value || "No asignado"}
        >
          {value || "No asignado"}
        </Typography>
      </Box>
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
        px: 1.45,
        fontWeight: 850,
        boxShadow: primary ? "0 8px 18px rgba(37, 99, 235, 0.18)" : "none",
      }}
    >
      {label}
    </Button>
  );
}

function CompactSummaryCard({
  title,
  value,
  subtitle,
  icon,
  tone = "primary",
  action,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "error";
  action?: ReactNode;
}) {
  const colorMap = {
    primary: "primary.main",
    success: "success.main",
    warning: "warning.main",
    error: "error.main",
  } as const;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "18px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <CardContent sx={{ p: 1.75 }}>
        <Stack spacing={1.1}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "13px",
                display: "grid",
                placeItems: "center",
                color: colorMap[tone],
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
              }}
            >
              {icon}
            </Box>

            {action}
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: 950, lineHeight: 1.05, letterSpacing: "-0.035em" }}
            >
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
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
          subtitle="Consulta tu información, expediente y vacaciones desde un solo lugar."
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
    <Stack spacing={{ xs: 1.8, md: 2.05 }} sx={{ pt: { xs: 0.5, md: 1 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          boxShadow: "0 14px 32px rgba(15, 23, 42, 0.065)",
          background:
            "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
          color: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.35 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 1.8, lg: 2.5 }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack spacing={1.05} sx={{ minWidth: 0 }}>
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

              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
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
                    minHeight: 30,
                    px: 1.45,
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
                width: { xs: "100%", lg: 292 },
                borderRadius: "17px",
                border: "1px solid",
                borderColor: alpha("#ffffff", 0.14),
                bgcolor: alpha("#ffffff", 0.08),
                p: 1.55,
                backdropFilter: "blur(10px)",
                flexShrink: 0,
              }}
            >
              <Stack spacing={1.05}>
                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
                  Resumen rápido
                </Typography>

                <Stack direction="row" spacing={2.1}>
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
                      {formatDays(vacationBalance)}
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
                  Vista compacta de tu expediente y vacaciones.
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
            xl: "1fr 1fr",
          },
          gap: { xs: 1.8, md: 2 },
          alignItems: "stretch",
        }}
      >
        <Box sx={{ height: "100%" }}>
          <SectionCard
            title="Mi perfil"
            subtitle="Datos laborales principales."
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
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.1,
            }}
          >
            <SmallDataPill
              label="Número"
              value={data.empleado.numEmpleado}
              icon={<BadgeRoundedIcon fontSize="small" />}
            />

            <SmallDataPill
              label="Puesto"
              value={data.empleado.puestoNombre}
              icon={<BusinessCenterRoundedIcon fontSize="small" />}
            />

            <SmallDataPill
              label="Departamento"
              value={data.empleado.departamentoNombre}
              icon={<ApartmentRoundedIcon fontSize="small" />}
            />

            <SmallDataPill
              label="Sucursal"
              value={data.empleado.sucursalNombre}
              icon={<StoreRoundedIcon fontSize="small" />}
            />
          </Box>
          </SectionCard>
        </Box>

        <Box sx={{ height: "100%" }}>
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
              label="Contraseña"
              onClick={() => navigate("/cambiar-password")}
            />
          </Box>
          </SectionCard>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1fr 1fr",
          },
          gap: { xs: 1.8, md: 2 },
        }}
      >
        <Box sx={{ height: "100%" }}>
          <Card
            elevation={0}
            sx={{
            borderRadius: "18px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="h6" fontWeight={950}>
                  Mis vacaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saldo disponible, ciclo y solicitudes personales.
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                startIcon={<BeachAccessRoundedIcon />}
                onClick={() => navigate("/mis-vacaciones")}
                sx={{ borderRadius: "10px", fontWeight: 850 }}
              >
                Ver detalle
              </Button>
            </Stack>

            <Box
              sx={{
                mt: 1.7,
                p: 2,
                borderRadius: "17px",
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
                background: (theme) =>
                  `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )}, ${alpha(theme.palette.primary.main, 0.025)})`,
              }}
            >
              {vacacionesLoading ? (
                <Box sx={{ py: 2, display: "grid", placeItems: "center" }}>
                  <CircularProgress size={24} />
                </Box>
              ) : vacacionesError ? (
                <Alert severity="warning">{vacacionesError}</Alert>
              ) : (
                <Stack spacing={1.25}>
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

                      <Stack direction="row" spacing={0.8} alignItems="baseline">
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 950,
                            letterSpacing: "-0.04em",
                            lineHeight: 1,
                          }}
                        >
                          {formatDays(vacationBalance)}
                        </Typography>

                        <Typography color="text.secondary" fontWeight={800}>
                          días
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        icon={<TaskAltRoundedIcon />}
                        label={`${formatDays(vacacionesResumen?.diasTomadosTotal ?? 0)} tomados`}
                        variant="outlined"
                        sx={{ fontWeight: 800 }}
                      />

                      <Chip
                        size="small"
                        icon={<PendingActionsRoundedIcon />}
                        label={`${vacacionesResumen?.periodosAbiertos ?? 0} periodo(s) abierto(s)`}
                        variant="outlined"
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                  </Stack>

                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: "13px",
                      "& .MuiAlert-message": {
                        fontSize: 13,
                      },
                    }}
                  >
                    Próximo aniversario: <strong>{vacationAnniversary}</strong>
                    {vacacionesResumen?.politicaNombre
                      ? ` · Política: ${vacacionesResumen.politicaNombre}`
                      : ""}
                  </Alert>
                </Stack>
              )}
            </Box>
            </CardContent>
          </Card>
        </Box>

        <Stack spacing={1.8} sx={{ height: "100%" }}>
          <CompactSummaryCard
            title="Mis documentos"
            value={`${data.documentos.cargados}/${data.documentos.requeridos}`}
            subtitle={`${data.documentos.faltantes} faltante(s) · ${data.documentos.vencidos} vencido(s)`}
            icon={<DescriptionRoundedIcon fontSize="small" />}
            tone={data.documentos.vencidos > 0 ? "error" : "warning"}
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

          <CompactSummaryCard
            title="Mis incidencias"
            value={data.incidencias.total}
            subtitle={`${data.incidencias.pendientes} pendiente(s) · ${data.incidencias.aprobadas} aprobada(s)`}
            icon={<PendingActionsRoundedIcon fontSize="small" />}
            tone={data.incidencias.pendientes > 0 ? "warning" : "primary"}
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
      </Box>

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

