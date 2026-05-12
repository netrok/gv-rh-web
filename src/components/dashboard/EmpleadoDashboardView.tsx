
import { getMisVacacionesResumen, type VacacionesResumen } from "../../api/vacaciones.api";import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  getMyDashboard,
  type MyDashboardData,
} from "../../api/dashboard.api";

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
        borderRadius: "16px",
        p: 1.75,
        bgcolor: "background.paper",
        minHeight: 86,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "13px",
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
            sx={{ display: "block", lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          <Typography
            fontWeight={850}
            sx={{
              lineHeight: 1.25,
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
        minHeight: 46,
        borderRadius: "14px",
        px: 1.75,
        fontWeight: 850,
        boxShadow: primary ? "0 10px 22px rgba(37, 99, 235, 0.22)" : "none",
      }}
    >
      {label}
    </Button>
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
      console.error(err);
      setVacacionesError("No se pudo cargar tu resumen de vacaciones.");
    } finally {
      setVacacionesLoading(false);
    }
  }
  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    void loadVacacionesResumen();
  }, []);
  const metricCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: "Documentos cargados",
        value: data.documentos.cargados,
        subtitle: `de ${data.documentos.requeridos} requeridos`,
        icon: <DescriptionRoundedIcon fontSize="small" />,
      },
      {
        title: "Por vencer",
        value: data.documentos.porVencer,
        subtitle: "Próximos 30 días",
        icon: <WarningAmberRoundedIcon fontSize="small" />,
      },
      {
        title: "Vencidos",
        value: data.documentos.vencidos,
        subtitle: "Requieren atención",
        icon: <ErrorOutlineRoundedIcon fontSize="small" />,
      },
      {
        title: "Incidencias pendientes",
        value: data.incidencias.pendientes,
        subtitle: "Esperando resolución",
        icon: <PendingActionsRoundedIcon fontSize="small" />,
      },
    ];
  }, [data]);

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

  const documentProgress =
    data.documentos.requeridos > 0
      ? Math.round((data.documentos.cargados / data.documentos.requeridos) * 100)
      : 100;

  return (
    <Stack spacing={{ xs: 2.25, md: 2.5 }} sx={{ pt: { xs: 0.5, md: 1 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "26px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
          color: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 2.25, lg: 3 }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack spacing={1.35} sx={{ minWidth: 0 }}>
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

              <Typography
                variant="body2"
                sx={{
                  color: alpha("#ffffff", 0.84),
                  maxWidth: 720,
                }}
              >
                Consulta tu expediente, documentos e incidencias desde un solo lugar.
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
                    minHeight: 34,
                    px: 1.75,
                    borderRadius: "12px",
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
                width: { xs: "100%", lg: 320 },
                borderRadius: "20px",
                border: "1px solid",
                borderColor: alpha("#ffffff", 0.14),
                bgcolor: alpha("#ffffff", 0.08),
                p: 2,
                backdropFilter: "blur(10px)",
                flexShrink: 0,
              }}
            >
              <Stack spacing={1.4}>
                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
                  Resumen rápido
                </Typography>

                <Stack direction="row" spacing={2.5}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      {data.documentos.cargados}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                      documentos
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      {data.incidencias.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                      incidencias
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
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
                    height: 8,
                    borderRadius: 999,
                    bgcolor: alpha("#ffffff", 0.16),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      bgcolor: "#ffffff",
                    },
                  }}
                />

                <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
                  Avance documental y seguimiento operativo de tu cuenta.
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
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: { xs: 1.75, md: 2 },
        }}
      >
        {metricCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1.12fr 0.88fr",
          },
          gap: { xs: 2, md: 2.25 },
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
              gap: 1.5,
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
          <Stack spacing={1.15}>
            <QuickActionButton
              primary
              icon={<FolderSharedRoundedIcon />}
              label="Mi expediente"
              onClick={() => navigate(`/empleados/${data.empleado.id}/expediente`)}
            />

            <QuickActionButton
              icon={<FactCheckRoundedIcon />}
              label="Mis incidencias"
              onClick={() => navigate("/incidencias")}
            />
            <QuickActionButton
              icon={<BeachAccessRoundedIcon />}
              label="Mis vacaciones"
              onClick={() => navigate("/vacaciones/solicitudes")}
            />

            <QuickActionButton
              icon={<LockResetRoundedIcon />}
              label="Cambiar contraseña"
              onClick={() => navigate("/cambiar-password")}
            />

            <Alert
              severity="info"
              sx={{
                mt: 0.5,
                borderRadius: "14px",
                "& .MuiAlert-message": {
                  fontSize: 13,
                },
              }}
            >
              Tu panel muestra solo información personal. La operación global queda reservada para perfiles administrativos.
            </Alert>
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "repeat(2, 1fr)",
          },
          gap: { xs: 2, md: 2.25 },
        }}
      >
        <SectionCard
          title="Mis documentos"
          subtitle="Estado de tus documentos requeridos."
          actions={
            <Chip
              size="small"
              color={data.documentos.completo ? "success" : "warning"}
              variant="outlined"
              label={data.documentos.completo ? "Expediente al corriente" : "Requiere atención"}
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
              gap: 1.5,
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
        <SectionCard
          title="Mis vacaciones"
          subtitle="Resumen de tu saldo, periodos abiertos y próximo aniversario."
          actions={
            <Button
              size="small"
              variant="outlined"
              startIcon={<BeachAccessRoundedIcon />}
              onClick={() => navigate("/vacaciones/solicitudes")}
              sx={{ borderRadius: "10px", fontWeight: 800 }}
            >
              Ver solicitudes
            </Button>
          }
        >
          {vacacionesLoading ? (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : vacacionesError ? (
            <Alert severity="warning">{vacacionesError}</Alert>
          ) : vacacionesResumen ? (
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                <MetricCard
                  title="Saldo disponible"
                  value={Number(vacacionesResumen.saldoDisponible ?? 0)}
                  subtitle="Días pendientes de disfrutar"
                  icon={<BeachAccessRoundedIcon fontSize="small" />}
                />

                <MetricCard
                  title="Días tomados"
                  value={Number(vacacionesResumen.diasTomadosTotal ?? 0)}
                  subtitle="Histórico disfrutado"
                  icon={<TaskAltRoundedIcon fontSize="small" />}
                />

                <MetricCard
                  title="Periodos abiertos"
                  value={Number(vacacionesResumen.periodosAbiertos ?? 0)}
                  subtitle={`Total periodos: ${vacacionesResumen.periodosTotales ?? 0}`}
                  icon={<PendingActionsRoundedIcon fontSize="small" />}
                />
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
                  {formatVacationDashboardDate(vacacionesResumen.proximoAniversario)}
                </strong>
                {vacacionesResumen.politicaNombre
                  ? ` · Política: ${vacacionesResumen.politicaNombre}`
                  : ""}
              </Alert>
            </Stack>
          ) : (
            <Alert severity="info">No hay información de vacaciones disponible.</Alert>
          )}
        </SectionCard>

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
              gap: 1.5,
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
      </Box>
    </Stack>
  );
}





