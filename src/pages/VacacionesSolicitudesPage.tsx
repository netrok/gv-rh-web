import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  aprobarVacacionesSolicitud,
  cancelarVacacionesSolicitud,
  createVacacionesSolicitud,
  getEstatusVacacionSolicitudLabel,
  getVacacionesEmpleadoLookup,
  getVacacionesSolicitudes,
  rechazarVacacionesSolicitud,
  type EstatusVacacionSolicitud,
  type VacacionesEmpleadoLookup,
  type VacacionesSolicitud,
  type VacacionesSolicitudCreate,
  type VacacionesSolicitudResolver,
} from "../api/vacacionesSolicitudes.api";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
});

function formatNumber(value?: number | null): string {
  return numberFormatter.format(Number(value ?? 0));
}

function formatDays(value?: number | null): string {
  return `${formatNumber(value)} días`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string; title?: string }>;
  return (
    axiosError.response?.data?.message ??
    axiosError.response?.data?.title ??
    axiosError.message ??
    "Ocurrió un error inesperado."
  );
}

function getInitials(value?: string | null): string {
  const parts = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "RH";

  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

function getStatusKey(value?: string | number | null): string {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "1") return "PENDIENTE";
  if (raw === "2") return "APROBADA";
  if (raw === "3") return "RECHAZADA";
  if (raw === "4") return "CANCELADA";

  return raw;
}

function getStatusColor(value?: string | number | null) {
  const key = getStatusKey(value);

  if (key === "APROBADA") return "success";
  if (key === "RECHAZADA") return "error";
  if (key === "CANCELADA") return "default";

  return "warning";
}

function calculateCalendarDays(fechaInicio: string, fechaFin: string): number {
  if (!fechaInicio || !fechaFin) return 0;

  const start = new Date(`${fechaInicio}T00:00:00`);
  const end = new Date(`${fechaFin}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(0, diff);
}

function EmployeeCell({
  nombre,
  numEmpleado,
  meta,
}: {
  nombre: string;
  numEmpleado: string;
  meta?: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: "0.74rem",
          fontWeight: 800,
          bgcolor: alpha("#1d4ed8", 0.1),
          color: "#1d4ed8",
        }}
      >
        {getInitials(nombre)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: { xs: 180, md: 300 },
          }}
        >
          {nombre || "Empleado sin nombre"}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          #{numEmpleado}
          {meta ? ` · ${meta}` : ""}
        </Typography>
      </Box>
    </Stack>
  );
}

function buildEmployeeMeta(item: VacacionesSolicitud | VacacionesEmpleadoLookup): string {
  const solicitud = item as Partial<VacacionesSolicitud>;
  const lookup = item as Partial<VacacionesEmpleadoLookup>;

  const sucursal = solicitud.sucursal ?? lookup.sucursalNombre;
  const departamento = solicitud.departamento ?? lookup.departamentoNombre;
  const puesto = solicitud.puesto ?? lookup.puestoNombre;

  return [sucursal, departamento, puesto].filter(Boolean).join(" · ");
}

type CreateFormState = {
  empleadoId: string;
  vacacionPeriodoId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: string;
  comentarioEmpleado: string;
};

const initialCreateForm: CreateFormState = {
  empleadoId: "",
  vacacionPeriodoId: "",
  fechaInicio: "",
  fechaFin: "",
  diasSolicitados: "1",
  comentarioEmpleado: "",
};

type ResolveDialogState =
  | {
      mode: "aprobar" | "rechazar" | "cancelar";
      solicitud: VacacionesSolicitud;
      comentarioResolucion: string;
      motivoRechazo: string;
    }
  | null;

export default function VacacionesSolicitudesPage() {
  const queryClient = useQueryClient();

  const [estatus, setEstatus] = useState<EstatusVacacionSolicitud | "">("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateForm);
  const [resolveDialog, setResolveDialog] = useState<ResolveDialogState>(null);

  const solicitudesQuery = useQuery({
    queryKey: ["vacaciones", "solicitudes", estatus, soloPendientes],
    queryFn: () =>
      getVacacionesSolicitudes({
        page: 1,
        pageSize: 80,
        estatus,
        soloPendientes,
      }),
  });

  const empleadosQuery = useQuery({
    queryKey: ["vacaciones", "solicitudes", "empleados-lookup"],
    queryFn: getVacacionesEmpleadoLookup,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateSolicitudes = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["vacaciones", "solicitudes"],
    });
  };

  const createMutation = useMutation({
    mutationFn: createVacacionesSolicitud,
    onSuccess: async () => {
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
      await invalidateSolicitudes();
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VacacionesSolicitudResolver }) =>
      aprobarVacacionesSolicitud(id, payload),
    onSuccess: async () => {
      setResolveDialog(null);
      await invalidateSolicitudes();
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VacacionesSolicitudResolver }) =>
      rechazarVacacionesSolicitud(id, payload),
    onSuccess: async () => {
      setResolveDialog(null);
      await invalidateSolicitudes();
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VacacionesSolicitudResolver }) =>
      cancelarVacacionesSolicitud(id, payload),
    onSuccess: async () => {
      setResolveDialog(null);
      await invalidateSolicitudes();
    },
  });

  const solicitudes = solicitudesQuery.data?.items ?? [];

  const diasCalendario = useMemo(
    () => calculateCalendarDays(createForm.fechaInicio, createForm.fechaFin),
    [createForm.fechaInicio, createForm.fechaFin]
  );

  const pendingMutation =
    createMutation.isPending ||
    aprobarMutation.isPending ||
    rechazarMutation.isPending ||
    cancelarMutation.isPending;

  const handleCreateSubmit = () => {
    const payload: VacacionesSolicitudCreate = {
      empleadoId: createForm.empleadoId ? Number(createForm.empleadoId) : null,
      vacacionPeriodoId: createForm.vacacionPeriodoId
        ? Number(createForm.vacacionPeriodoId)
        : null,
      fechaInicio: createForm.fechaInicio,
      fechaFin: createForm.fechaFin,
      diasSolicitados: Number(createForm.diasSolicitados),
      comentarioEmpleado: createForm.comentarioEmpleado.trim() || null,
    };

    createMutation.mutate(payload);
  };

  const handleResolveSubmit = () => {
    if (!resolveDialog) return;

    const payload: VacacionesSolicitudResolver = {
      comentarioResolucion: resolveDialog.comentarioResolucion.trim() || null,
      motivoRechazo: resolveDialog.motivoRechazo.trim() || null,
    };

    if (resolveDialog.mode === "aprobar") {
      aprobarMutation.mutate({ id: resolveDialog.solicitud.id, payload });
      return;
    }

    if (resolveDialog.mode === "rechazar") {
      rechazarMutation.mutate({ id: resolveDialog.solicitud.id, payload });
      return;
    }

    cancelarMutation.mutate({ id: resolveDialog.solicitud.id, payload });
  };

  const createError = createMutation.error ? getErrorMessage(createMutation.error) : null;
  const resolveError =
    aprobarMutation.error || rechazarMutation.error || cancelarMutation.error
      ? getErrorMessage(aprobarMutation.error ?? rechazarMutation.error ?? cancelarMutation.error)
      : null;

  return (
    <AppPage
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              solicitudesQuery.isFetching ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={() => void solicitudesQuery.refetch()}
            disabled={solicitudesQuery.isFetching}
          >
            Actualizar
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nueva solicitud
          </Button>
        </Stack>
      }
    >
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <Stack spacing={2.25}>
          <HeroBanner
            eyebrow="Vacaciones / Solicitudes"
            title="Solicitudes de vacaciones"
            subtitle="Registra, revisa, aprueba o rechaza solicitudes. Al aprobar, el sistema descuenta saldo, genera kárdex e incidencia de vacaciones."
            badge={`${solicitudesQuery.data?.pendientes ?? 0} pendiente(s)`}
          />

          {solicitudesQuery.isError ? (
            <Alert severity="error">
              No se pudieron cargar las solicitudes. Revisa que el backend tenga activo
              /api/Vacaciones/solicitudes.
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
              gap: 1.5,
            }}
          >
            <MetricCard
              title="Pendientes"
              value={solicitudesQuery.data?.pendientes ?? 0}
              subtitle="Requieren revisión"
              icon={<HourglassBottomRoundedIcon />}
            />

            <MetricCard
              title="Aprobadas"
              value={solicitudesQuery.data?.aprobadas ?? 0}
              subtitle="Ya impactaron kárdex"
              icon={<CheckCircleRoundedIcon />}
            />

            <MetricCard
              title="Rechazadas"
              value={solicitudesQuery.data?.rechazadas ?? 0}
              subtitle="No impactan saldo"
              icon={<CloseRoundedIcon />}
            />

            <MetricCard
              title="Canceladas"
              value={solicitudesQuery.data?.canceladas ?? 0}
              subtitle="Canceladas antes de aprobar"
              icon={<CancelRoundedIcon />}
            />
          </Box>

          <SectionCard
            title="Bandeja de solicitudes"
            subtitle="Control operativo de solicitudes de vacaciones."
            actions={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <TextField
                  select
                  size="small"
                  label="Estatus"
                  value={estatus}
                  onChange={(event) =>
                    setEstatus(event.target.value as EstatusVacacionSolicitud | "")
                  }
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                  <MenuItem value="APROBADA">Aprobadas</MenuItem>
                  <MenuItem value="RECHAZADA">Rechazadas</MenuItem>
                  <MenuItem value="CANCELADA">Canceladas</MenuItem>
                </TextField>

                <Button
                  size="small"
                  variant={soloPendientes ? "contained" : "outlined"}
                  onClick={() => setSoloPendientes((value) => !value)}
                >
                  Solo pendientes
                </Button>
              </Stack>
            }
          >
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Periodo solicitado</TableCell>
                    <TableCell align="right">Días</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell>Resolución</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {solicitudesQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Cargando solicitudes...</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : solicitudes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box
                          sx={{
                            py: 4,
                            textAlign: "center",
                            border: "1px dashed",
                            borderColor: alpha("#2563eb", 0.18),
                            bgcolor: alpha("#2563eb", 0.035),
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Sin solicitudes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No hay solicitudes con los filtros actuales.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitudes.map((item) => {
                      const statusKey = getStatusKey(item.estatus);
                      const canResolve = statusKey === "PENDIENTE";

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <EmployeeCell
                              nombre={item.nombreEmpleado}
                              numEmpleado={item.numEmpleado}
                              meta={buildEmployeeMeta(item)}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {formatDate(item.fechaInicio)} — {formatDate(item.fechaFin)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Folio SOL-VAC-{item.id}
                              {item.vacacionPeriodoId
                                ? ` · Periodo ${item.vacacionPeriodoId}`
                                : ""}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {formatDays(item.diasSolicitados)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              color={getStatusColor(item.estatus)}
                              variant="outlined"
                              label={getEstatusVacacionSolicitudLabel(
                                item.estatusNombre || item.estatus
                              )}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.resueltaPorUsuario ?? "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.fechaResolucionUtc
                                ? formatDateTime(item.fechaResolucionUtc)
                                : "Sin resolución"}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.75}
                              justifyContent="flex-end"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                disabled={!canResolve || pendingMutation}
                                onClick={() =>
                                  setResolveDialog({
                                    mode: "aprobar",
                                    solicitud: item,
                                    comentarioResolucion: "",
                                    motivoRechazo: "",
                                  })
                                }
                              >
                                Aprobar
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={!canResolve || pendingMutation}
                                onClick={() =>
                                  setResolveDialog({
                                    mode: "rechazar",
                                    solicitud: item,
                                    comentarioResolucion: "",
                                    motivoRechazo: "",
                                  })
                                }
                              >
                                Rechazar
                              </Button>

                              <Button
                                size="small"
                                variant="text"
                                color="inherit"
                                disabled={!canResolve || pendingMutation}
                                onClick={() =>
                                  setResolveDialog({
                                    mode: "cancelar",
                                    solicitud: item,
                                    comentarioResolucion: "",
                                    motivoRechazo: "",
                                  })
                                }
                              >
                                Cancelar
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Stack>
      </Box>

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!createMutation.isPending) setCreateOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva solicitud de vacaciones</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}

            <Alert severity="info">
              Para empleados, deja el empleado vacío: el backend usará tu cuenta vinculada.
              ADMIN/RRHH/JEFE pueden seleccionar un empleado.
            </Alert>

            <TextField
              select
              label="Empleado"
              value={createForm.empleadoId}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  empleadoId: event.target.value,
                }))
              }
              disabled={empleadosQuery.isLoading}
              helperText={
                empleadosQuery.isError
                  ? "No se pudo cargar el catálogo. Puedes dejarlo vacío si es solicitud propia."
                  : "Opcional para empleado. Requerido si capturas para otra persona."
              }
            >
              <MenuItem value="">Mi solicitud / sin empleado explícito</MenuItem>
              {(empleadosQuery.data ?? []).map((empleado) => (
                <MenuItem key={empleado.id} value={String(empleado.id)}>
                  #{empleado.numEmpleado} · {empleado.nombreCompleto}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Fecha inicio"
                type="date"
                value={createForm.fechaInicio}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    fechaInicio: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Fecha fin"
                type="date"
                value={createForm.fechaFin}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    fechaFin: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Días solicitados"
                type="number"
                value={createForm.diasSolicitados}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    diasSolicitados: event.target.value,
                  }))
                }
                inputProps={{ min: 0.5, step: 0.5 }}
                helperText={
                  diasCalendario > 0
                    ? `Rango calendario: ${diasCalendario} día(s)`
                    : "Captura el número de días a descontar"
                }
                fullWidth
              />

              <TextField
                label="Periodo vacaciones ID"
                type="number"
                value={createForm.vacacionPeriodoId}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    vacacionPeriodoId: event.target.value,
                  }))
                }
                helperText="Opcional. Si lo dejas vacío, usa el periodo abierto con saldo."
                fullWidth
              />
            </Stack>

            <TextField
              label="Comentario"
              value={createForm.comentarioEmpleado}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  comentarioEmpleado: event.target.value,
                }))
              }
              multiline
              minRows={3}
              placeholder="Ej. Solicito vacaciones por viaje familiar."
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setCreateOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={
              createMutation.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <BeachAccessRoundedIcon />
              )
            }
            onClick={handleCreateSubmit}
            disabled={
              createMutation.isPending ||
              !createForm.fechaInicio ||
              !createForm.fechaFin ||
              Number(createForm.diasSolicitados) <= 0
            }
          >
            Crear solicitud
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(resolveDialog)}
        onClose={() => {
          if (!pendingMutation) setResolveDialog(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {resolveDialog?.mode === "aprobar"
            ? "Aprobar solicitud"
            : resolveDialog?.mode === "rechazar"
              ? "Rechazar solicitud"
              : "Cancelar solicitud"}
        </DialogTitle>

        <DialogContent>
          {resolveDialog ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {resolveError ? <Alert severity="error">{resolveError}</Alert> : null}

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: alpha("#0f172a", 0.08),
                  bgcolor: alpha("#f8fafc", 0.8),
                }}
              >
                <EmployeeCell
                  nombre={resolveDialog.solicitud.nombreEmpleado}
                  numEmpleado={resolveDialog.solicitud.numEmpleado}
                  meta={buildEmployeeMeta(resolveDialog.solicitud)}
                />

                <Divider sx={{ my: 1.25 }} />

                <Typography variant="body2">
                  {formatDate(resolveDialog.solicitud.fechaInicio)} —{" "}
                  {formatDate(resolveDialog.solicitud.fechaFin)} ·{" "}
                  <strong>{formatDays(resolveDialog.solicitud.diasSolicitados)}</strong>
                </Typography>
              </Box>

              {resolveDialog.mode === "aprobar" ? (
                <Alert severity="warning">
                  Al aprobar se descontará saldo, se generará movimiento DISFRUTE en kárdex
                  y se creará una incidencia VACACIONES aprobada.
                </Alert>
              ) : null}

              {resolveDialog.mode === "rechazar" ? (
                <TextField
                  label="Motivo de rechazo"
                  value={resolveDialog.motivoRechazo}
                  onChange={(event) =>
                    setResolveDialog((current) =>
                      current
                        ? {
                            ...current,
                            motivoRechazo: event.target.value,
                          }
                        : current
                    )
                  }
                  multiline
                  minRows={2}
                  required
                />
              ) : null}

              <TextField
                label="Comentario de resolución"
                value={resolveDialog.comentarioResolucion}
                onChange={(event) =>
                  setResolveDialog((current) =>
                    current
                      ? {
                          ...current,
                          comentarioResolucion: event.target.value,
                        }
                      : current
                  )
                }
                multiline
                minRows={3}
              />
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setResolveDialog(null)} disabled={pendingMutation}>
            Cerrar
          </Button>

          <Button
            variant="contained"
            color={
              resolveDialog?.mode === "aprobar"
                ? "success"
                : resolveDialog?.mode === "rechazar"
                  ? "error"
                  : "inherit"
            }
            startIcon={
              pendingMutation ? (
                <CircularProgress size={16} />
              ) : resolveDialog?.mode === "aprobar" ? (
                <CheckCircleRoundedIcon />
              ) : resolveDialog?.mode === "rechazar" ? (
                <CloseRoundedIcon />
              ) : (
                <CancelRoundedIcon />
              )
            }
            onClick={handleResolveSubmit}
            disabled={
              pendingMutation ||
              (resolveDialog?.mode === "rechazar" &&
                !resolveDialog.motivoRechazo.trim() &&
                !resolveDialog.comentarioResolucion.trim())
            }
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}