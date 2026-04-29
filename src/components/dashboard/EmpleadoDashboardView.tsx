import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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

export default function EmpleadoDashboardView() {
  const navigate = useNavigate();

  const [data, setData] = useState<MyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadData();
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
                refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshRoundedIcon />
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
    <Stack spacing={3}>
      <HeroBanner
        eyebrow="Panel personal"
        title={`Hola, ${data.empleado.nombreCompleto}`}
        subtitle="Aquí ves tu información principal, el estado de tus documentos y el seguimiento de tus incidencias."
        badge={data.empleado.activo ? "Activo" : "Inactivo"}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={data.empleado.numEmpleado}
              variant="outlined"
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />
            <Button
              variant="contained"
              startIcon={
                refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshRoundedIcon />
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
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </Stack>
        }
        aside={
          <Stack spacing={1.25}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {data.documentos.cargados}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  documentos
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {data.incidencias.total}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  incidencias
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Consulta tu avance documental y el estado de tus solicitudes sin mezclarte con la operación administrativa.
            </Typography>
          </Stack>
        }
      />

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
            xl: "1.15fr 0.85fr",
          },
          gap: 3,
        }}
      >
        <SectionCard
          title="Mi perfil"
          subtitle="Datos organizacionales del empleado autenticado."
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
              gap: 2,
            }}
          >
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                p: 2,
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <BadgeRoundedIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Número de empleado
                  </Typography>
                  <Typography fontWeight={800}>
                    {data.empleado.numEmpleado}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                p: 2,
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <BusinessCenterRoundedIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Puesto
                  </Typography>
                  <Typography fontWeight={800}>
                    {data.empleado.puestoNombre || "No asignado"}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                p: 2,
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <ApartmentRoundedIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Departamento
                  </Typography>
                  <Typography fontWeight={800}>
                    {data.empleado.departamentoNombre || "No asignado"}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                p: 2,
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <StoreRoundedIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sucursal
                  </Typography>
                  <Typography fontWeight={800}>
                    {data.empleado.sucursalNombre || "No asignada"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard
          title="Accesos directos"
          subtitle="Atajos útiles para operar tu cuenta."
        >
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<FactCheckRoundedIcon />}
              onClick={() => navigate("/incidencias")}
            >
              Mis incidencias
            </Button>

            <Button
              variant="outlined"
              startIcon={<LockResetRoundedIcon />}
              onClick={() => navigate("/cambiar-password")}
            >
              Cambiar contraseña
            </Button>

            <Button
              variant="outlined"
              startIcon={<FolderSharedRoundedIcon />}
              onClick={() => navigate(`/empleados/${data.empleado.id}/expediente`)}
            >
              Mi expediente
            </Button>

            <Alert severity="info">
              Este panel está centrado en tu información personal. La operación global del sistema queda reservada para perfiles administrativos.
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
          gap: 3,
        }}
      >
        <SectionCard
          title="Mis documentos"
          subtitle="Seguimiento rápido del estado documental del empleado."
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
              gap: 2,
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
          title="Mis incidencias"
          subtitle="Estado resumido de tus registros e incidencias."
        >
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