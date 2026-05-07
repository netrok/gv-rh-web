import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";

import {
  getMiEquipo,
  getTipoRelacionLabel,
  type MiEquipoEmpleado,
} from "../api/miEquipo.api";

function getInitials(name?: string | null): string {
  const clean = (name ?? "").trim();

  if (!clean) return "GV";

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeAxios = error as {
      response?: {
        data?: unknown;
        status?: number;
      };
    };

    const data = maybeAxios.response?.data;

    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;

      if (typeof message === "string") return message;
    }

    if (maybeAxios.response?.status === 403) {
      return "Tu usuario no está ligado a un empleado con equipo asignado o no tiene permisos para consultar esta vista.";
    }
  }

  return "No se pudo cargar tu equipo.";
}

function relationChipColor(value?: string | null): "primary" | "secondary" | "default" {
  const normalized = (value ?? "").toUpperCase();

  if (normalized === "APROBADOR_PRIMARIO") return "primary";
  if (normalized === "APROBADOR_SECUNDARIO") return "secondary";

  return "default";
}

function EmployeeCell({ item }: { item: MiEquipoEmpleado }) {
  const meta = [
    item.sucursalNombre,
    item.departamentoNombre,
    item.puestoNombre,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Avatar
        sx={{
          width: 38,
          height: 38,
          fontWeight: 900,
          bgcolor: "primary.main",
          color: "#fff",
          fontSize: "0.9rem",
        }}
      >
        {getInitials(item.nombreCompleto)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={850} noWrap>
          {item.nombreCompleto || "Empleado sin nombre"}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          #{item.numEmpleado || "—"}
          {meta ? ` · ${meta}` : ""}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function MiEquipoPage() {
  const query = useQuery({
    queryKey: ["mi-equipo"],
    queryFn: getMiEquipo,
  });

  const empleados = query.data?.empleados ?? [];

  const activos = useMemo(
    () => empleados.filter((item) => item.activo).length,
    [empleados]
  );

  const sucursales = useMemo(
    () =>
      new Set(
        empleados
          .map((item) => item.sucursalNombre)
          .filter((value): value is string => Boolean(value))
      ).size,
    [empleados]
  );

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.22)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,64,175,0.95) 50%, rgba(14,116,144,0.92) 100%)",
          color: "#fff",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.6} alignItems="flex-start">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <SupervisorAccountRoundedIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  Jerarquía operativa
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mt: 0.4,
                    fontWeight: 950,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Mi equipo
                </Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    color: "rgba(255,255,255,0.78)",
                    maxWidth: 760,
                    lineHeight: 1.55,
                  }}
                >
                  Consulta el personal que tienes asignado como aprobador primario o secundario.
                  La sucursal ubica, el departamento clasifica y el aprobador define autoridad.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                color="inherit"
                component={RouterLink}
                to="/incidencias"
                startIcon={<EventBusyRoundedIcon />}
                sx={{
                  color: "#0f172a",
                  fontWeight: 850,
                  textTransform: "none",
                  borderRadius: "10px",
                }}
              >
                Incidencias
              </Button>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/vacaciones/solicitudes"
                startIcon={<AssignmentTurnedInRoundedIcon />}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.42)",
                  fontWeight: 850,
                  textTransform: "none",
                  borderRadius: "10px",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Solicitudes
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {query.isError ? (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => query.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getErrorMessage(query.error)}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid rgba(148,163,184,0.2)" }}>
          <CardContent>
            <Stack spacing={0.8}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary" fontWeight={800}>
                  Total asignado
                </Typography>
                <Groups2RoundedIcon color="primary" />
              </Stack>
              <Typography variant="h4" fontWeight={950}>
                {query.isLoading ? "—" : query.data?.total ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Personas bajo tu alcance operativo.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid rgba(148,163,184,0.2)" }}>
          <CardContent>
            <Stack spacing={0.8}>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>
                Aprobador primario
              </Typography>
              <Typography variant="h4" fontWeight={950}>
                {query.isLoading ? "—" : query.data?.comoAprobadorPrimario ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Relación principal de autoridad.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid rgba(148,163,184,0.2)" }}>
          <CardContent>
            <Stack spacing={0.8}>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>
                Aprobador secundario
              </Typography>
              <Typography variant="h4" fontWeight={950}>
                {query.isLoading ? "—" : query.data?.comoAprobadorSecundario ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Respaldo o supervisión alterna.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid rgba(148,163,184,0.2)" }}>
          <CardContent>
            <Stack spacing={0.8}>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>
                Activos / sucursales
              </Typography>
              <Typography variant="h4" fontWeight={950}>
                {query.isLoading ? "—" : `${activos}/${sucursales}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Activos y sedes involucradas.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(148,163,184,0.22)" }}>
        <CardContent sx={{ p: 0 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
            sx={{ px: 2.25, py: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Personal asignado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {query.data?.jefeNombre
                  ? `Equipo directo de ${query.data.jefeNombre}.`
                  : "Relación de empleados bajo tu alcance."}
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "10px" }}
            >
              Actualizar
            </Button>
          </Stack>

          <Divider />

          {query.isLoading ? (
            <Box sx={{ py: 7, display: "grid", placeItems: "center" }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">Cargando equipo...</Typography>
              </Stack>
            </Box>
          ) : empleados.length === 0 ? (
            <Box sx={{ py: 7, px: 2, textAlign: "center" }}>
              <SupervisorAccountRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
              <Typography fontWeight={900}>Sin personal asignado</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Cuando seas aprobador primario o secundario de un empleado, aparecerá aquí.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Puesto</TableCell>
                    <TableCell>Relación</TableCell>
                    <TableCell align="right">Estado</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {empleados.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ minWidth: 280 }}>
                        <EmployeeCell item={item} />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <BusinessRoundedIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">
                            {item.sucursalNombre || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {item.departamentoNombre || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <BadgeRoundedIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">
                            {item.puestoNombre || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          color={relationChipColor(item.tipoRelacion)}
                          variant="outlined"
                          label={getTipoRelacionLabel(item.tipoRelacion)}
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          color={item.activo ? "success" : "default"}
                          variant={item.activo ? "filled" : "outlined"}
                          label={item.estatusLaboral || (item.activo ? "ACTIVO" : "INACTIVO")}
                          sx={{ fontWeight: 850 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}