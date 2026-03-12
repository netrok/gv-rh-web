import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEmpleado,
  getEmpleados,
  updateEmpleado,
  type Empleado,
  type SaveEmpleadoInput,
} from "../api/empleados.api";
import {
  getDepartamentos,
  type Departamento,
} from "../api/departamentos.api";
import { getPuestos, type Puesto } from "../api/puestos.api";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

const empleadoSchema = z.object({
  nombres: z
    .string()
    .min(1, "Los nombres son obligatorios")
    .max(120, "Máximo 120 caracteres"),
  apellidoPaterno: z
    .string()
    .min(1, "El apellido paterno es obligatorio")
    .max(120, "Máximo 120 caracteres"),
  apellidoMaterno: z.string().max(120, "Máximo 120 caracteres"),
  fechaNacimiento: z.string(),
  telefono: z.string().max(30, "Máximo 30 caracteres"),
  email: z.union([z.literal(""), z.string().email("Correo inválido")]),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  activo: z.boolean(),
  departamentoId: z.coerce.number().min(1, "Debes seleccionar un departamento"),
  puestoId: z.coerce.number().min(1, "Debes seleccionar un puesto"),
});

type EmpleadoFormInput = z.input<typeof empleadoSchema>;
type EmpleadoFormValues = z.output<typeof empleadoSchema>;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.response?.data?.error;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    return `${error.response?.status ?? ""} ${error.response?.statusText ?? error.message}`.trim();
  }

  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
  }).format(date);
}

function getPuestoDepartamentoId(puesto: Puesto) {
  const maybeDepartamentoId =
    (puesto as Puesto & {
      departamentoID?: number | string | null;
      departamento?: { id?: number | string | null } | null;
    }).departamentoId ??
    (puesto as Puesto & {
      departamentoID?: number | string | null;
      departamento?: { id?: number | string | null } | null;
    }).departamentoID ??
    (puesto as Puesto & {
      departamento?: { id?: number | string | null } | null;
    }).departamento?.id ??
    0;

  return Number(maybeDepartamentoId || 0);
}

function EmpleadoDialog({
  open,
  onClose,
  onSubmit,
  saving,
  initialValues,
  departamentos,
  puestos,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SaveEmpleadoInput) => Promise<void>;
  saving: boolean;
  initialValues: Empleado | null;
  departamentos: Departamento[];
  puestos: Puesto[];
}) {
  const isEdit = !!initialValues;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmpleadoFormInput, unknown, EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      nombres: initialValues?.nombres ?? "",
      apellidoPaterno: initialValues?.apellidoPaterno ?? "",
      apellidoMaterno: initialValues?.apellidoMaterno ?? "",
      fechaNacimiento: initialValues?.fechaNacimiento ?? "",
      telefono: initialValues?.telefono ?? "",
      email: initialValues?.email ?? "",
      fechaIngreso: initialValues?.fechaIngreso ?? "",
      activo: initialValues?.activo ?? true,
      departamentoId: initialValues?.departamentoId ?? 0,
      puestoId: initialValues?.puestoId ?? 0,
    },
  });

  const activo = watch("activo");
  const departamentoId = Number(watch("departamentoId") ?? 0);
  const puestoId = Number(watch("puestoId") ?? 0);

  const puestosDisponibles = useMemo(() => {
    const depId = Number(departamentoId || 0);
    return puestos.filter((p) => getPuestoDepartamentoId(p) === depId);
  }, [puestos, departamentoId]);

  useEffect(() => {
    reset({
      nombres: initialValues?.nombres ?? "",
      apellidoPaterno: initialValues?.apellidoPaterno ?? "",
      apellidoMaterno: initialValues?.apellidoMaterno ?? "",
      fechaNacimiento: initialValues?.fechaNacimiento ?? "",
      telefono: initialValues?.telefono ?? "",
      email: initialValues?.email ?? "",
      fechaIngreso: initialValues?.fechaIngreso ?? "",
      activo: initialValues?.activo ?? true,
      departamentoId: initialValues?.departamentoId ?? 0,
      puestoId: initialValues?.puestoId ?? 0,
    });
  }, [initialValues, reset, open]);

  useEffect(() => {
    if (
      puestoId > 0 &&
      !puestosDisponibles.some((p) => Number(p.id) === puestoId)
    ) {
      setValue("puestoId", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [puestoId, puestosDisponibles, setValue]);

  const submitForm = async (values: EmpleadoFormValues) => {
    const puestoSeleccionado = puestos.find(
      (p) => Number(p.id) === Number(values.puestoId)
    );

    if (
      !puestoSeleccionado ||
      getPuestoDepartamentoId(puestoSeleccionado) !== Number(values.departamentoId)
    ) {
      throw new Error("El puesto seleccionado no pertenece al departamento.");
    }

    await onSubmit({
      nombres: values.nombres.trim(),
      apellidoPaterno: values.apellidoPaterno.trim(),
      apellidoMaterno: normalizeOptional(values.apellidoMaterno),
      fechaNacimiento: normalizeOptional(values.fechaNacimiento),
      telefono: normalizeOptional(values.telefono),
      email: normalizeOptional(values.email),
      fechaIngreso: values.fechaIngreso,
      activo: values.activo,
      departamentoId: Number(values.departamentoId),
      puestoId: Number(values.puestoId),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{isEdit ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>

      <DialogContent dividers>
        <Box
          component="form"
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
          onSubmit={handleSubmit(submitForm)}
        >
          <TextField
            label="Nombres"
            {...register("nombres")}
            error={!!errors.nombres}
            helperText={errors.nombres?.message}
          />

          <TextField
            label="Apellido paterno"
            {...register("apellidoPaterno")}
            error={!!errors.apellidoPaterno}
            helperText={errors.apellidoPaterno?.message}
          />

          <TextField
            label="Apellido materno"
            {...register("apellidoMaterno")}
            error={!!errors.apellidoMaterno}
            helperText={errors.apellidoMaterno?.message}
          />

          <TextField
            label="Teléfono"
            {...register("telefono")}
            error={!!errors.telefono}
            helperText={errors.telefono?.message}
          />

          <TextField
            label="Correo"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Fecha de nacimiento"
            type="date"
            {...register("fechaNacimiento")}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Fecha de ingreso"
            type="date"
            {...register("fechaIngreso")}
            error={!!errors.fechaIngreso}
            helperText={errors.fechaIngreso?.message}
            InputLabelProps={{ shrink: true }}
          />

          <Box />

          <TextField
            select
            label="Departamento"
            value={departamentoId}
            onChange={(e) => {
              const value = Number(e.target.value);
              setValue("departamentoId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("puestoId", 0, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            error={!!errors.departamentoId}
            helperText={errors.departamentoId?.message}
          >
            <MenuItem value={0}>Selecciona un departamento</MenuItem>
            {departamentos.map((dep) => (
              <MenuItem key={dep.id} value={dep.id}>
                {dep.clave} - {dep.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Puesto"
            value={puestoId}
            onChange={(e) => {
              setValue("puestoId", Number(e.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            error={!!errors.puestoId}
            helperText={
              errors.puestoId?.message ||
              (departamentoId <= 0
                ? "Primero selecciona un departamento"
                : puestosDisponibles.length === 0
                ? "No hay puestos para este departamento"
                : "")
            }
            disabled={departamentoId <= 0 || puestosDisponibles.length === 0}
          >
            <MenuItem value={0}>
              {departamentoId > 0
                ? "Selecciona un puesto"
                : "Primero elige un departamento"}
            </MenuItem>
            {puestosDisponibles.map((puesto) => (
              <MenuItem key={puesto.id} value={puesto.id}>
                {puesto.clave} - {puesto.nombre}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={activo}
                onChange={(_, checked) =>
                  setValue("activo", checked, { shouldDirty: true })
                }
              />
            }
            label={activo ? "Activo" : "Inactivo"}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(submitForm)}
          variant="contained"
          disabled={saving}
        >
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EmpleadosPage() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Empleado | null>(null);

  const empleadosQuery = useQuery({
    queryKey: ["empleados"],
    queryFn: getEmpleados,
  });

  const departamentosQuery = useQuery({
    queryKey: ["departamentos"],
    queryFn: getDepartamentos,
  });

  const puestosQuery = useQuery({
    queryKey: ["puestos"],
    queryFn: getPuestos,
  });

  const departamentos = departamentosQuery.data ?? [];
  const puestos = puestosQuery.data ?? [];

  const departamentosMap = useMemo(() => {
    return new Map(departamentos.map((d) => [Number(d.id), d]));
  }, [departamentos]);

  const puestosMap = useMemo(() => {
    return new Map(puestos.map((p) => [Number(p.id), p]));
  }, [puestos]);

  const saveMutation = useMutation({
    mutationFn: async (values: SaveEmpleadoInput) => {
      if (editing) {
        return updateEmpleado(editing.id, values);
      }

      return createEmpleado(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      setDialogOpen(false);
      setEditing(null);
      showSnackbar(
        editing ? "Empleado actualizado." : "Empleado creado.",
        "success"
      );
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (row: Empleado) => {
      if (!row.departamentoId || !row.puestoId) {
        throw new Error("El empleado no tiene departamento o puesto asignado.");
      }

      return updateEmpleado(row.id, {
        nombres: row.nombres,
        apellidoPaterno: row.apellidoPaterno,
        apellidoMaterno: row.apellidoMaterno ?? null,
        fechaNacimiento: row.fechaNacimiento ?? null,
        telefono: row.telefono ?? null,
        email: row.email ?? null,
        fechaIngreso: row.fechaIngreso,
        activo: !row.activo,
        departamentoId: Number(row.departamentoId),
        puestoId: Number(row.puestoId),
      });
    },
    onSuccess: (_, row) => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      showSnackbar(
        row.activo ? "Empleado desactivado." : "Empleado reactivado.",
        "success"
      );
      setConfirmTarget(null);
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
      setConfirmTarget(null);
    },
  });

  const filteredRows = useMemo(() => {
    const rows = empleadosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const departamento = row.departamentoId
        ? departamentosMap.get(Number(row.departamentoId))
        : undefined;
      const puesto = row.puestoId
        ? puestosMap.get(Number(row.puestoId))
        : undefined;

      const matchesDepartamento = departamentoFilter
        ? Number(row.departamentoId) === Number(departamentoFilter)
        : true;

      const matchesStatus =
        statusFilter === ""
          ? true
          : statusFilter === "ACTIVO"
          ? row.activo
          : !row.activo;

      const fullName = [
        row.nombres,
        row.apellidoPaterno,
        row.apellidoMaterno ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term
        ? true
        : row.numEmpleado.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          (row.email ?? "").toLowerCase().includes(term) ||
          (departamento?.nombre ?? "").toLowerCase().includes(term) ||
          (puesto?.nombre ?? "").toLowerCase().includes(term) ||
          (row.activo ? "activo" : "inactivo").includes(term);

      return matchesDepartamento && matchesStatus && matchesSearch;
    });
  }, [
    empleadosQuery.data,
    search,
    departamentoFilter,
    statusFilter,
    departamentosMap,
    puestosMap,
  ]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Empleado) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const canOpenDialog = departamentos.length > 0 && puestos.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Empleados"
        subtitle="Catálogo de empleados de RH."
        actions={[
          {
            label: "Actualizar",
            variant: "outlined",
            startIcon: <RefreshIcon />,
            onClick: () => {
              empleadosQuery.refetch();
              departamentosQuery.refetch();
              puestosQuery.refetch();
            },
          },
          {
            label: "Nuevo empleado",
            variant: "contained",
            startIcon: <AddIcon />,
            onClick: openCreateDialog,
            disabled: !canOpenDialog,
          },
        ]}
      />

      {!canOpenDialog &&
        !departamentosQuery.isLoading &&
        !puestosQuery.isLoading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Necesitas departamentos y puestos registrados para crear empleados.
          </Alert>
        )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 260px 180px" },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              label="Buscar"
              placeholder="No. empleado, nombre, correo, puesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <TextField
              select
              label="Filtrar por departamento"
              value={departamentoFilter}
              onChange={(e) => setDepartamentoFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {departamentos.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  {dep.clave} - {dep.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Estatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activos</MenuItem>
              <MenuItem value="INACTIVO">Inactivos</MenuItem>
            </TextField>
          </Box>

          {empleadosQuery.isLoading ||
          departamentosQuery.isLoading ||
          puestosQuery.isLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : empleadosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo. {getErrorMessage(empleadosQuery.error)}
            </Alert>
          ) : departamentosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo de departamentos.{" "}
              {getErrorMessage(departamentosQuery.error)}
            </Alert>
          ) : puestosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo de puestos.{" "}
              {getErrorMessage(puestosQuery.error)}
            </Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>No. Empleado</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Puesto</TableCell>
                    <TableCell>Ingreso</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay empleados para mostrar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const departamento = row.departamentoId
                        ? departamentosMap.get(Number(row.departamentoId))
                        : undefined;
                      const puesto = row.puestoId
                        ? puestosMap.get(Number(row.puestoId))
                        : undefined;

                      return (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.numEmpleado}</TableCell>
                          <TableCell>
                            {[row.nombres, row.apellidoPaterno, row.apellidoMaterno ?? ""]
                              .filter(Boolean)
                              .join(" ")}
                          </TableCell>
                          <TableCell>
                            {departamento
                              ? `${departamento.clave} - ${departamento.nombre}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {puesto ? `${puesto.clave} - ${puesto.nombre}` : "-"}
                          </TableCell>
                          <TableCell>{formatDate(row.fechaIngreso)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.activo ? "Activo" : "Inactivo"}
                              color={row.activo ? "success" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => openEditDialog(row)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={row.activo ? "Desactivar" : "Reactivar"}>
                              <IconButton onClick={() => setConfirmTarget(row)}>
                                <SyncAltIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <EmpleadoDialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          setDialogOpen(false);
          setEditing(null);
        }}
        initialValues={editing}
        saving={saveMutation.isPending}
        departamentos={departamentos}
        puestos={puestos}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            toggleMutation.mutate(confirmTarget);
          }
        }}
        loading={toggleMutation.isPending}
        title={confirmTarget?.activo ? "Desactivar empleado" : "Reactivar empleado"}
        message={
          confirmTarget
            ? confirmTarget.activo
              ? `Se desactivará el empleado "${[
                  confirmTarget.nombres,
                  confirmTarget.apellidoPaterno,
                  confirmTarget.apellidoMaterno ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}".`
              : `Se reactivará el empleado "${[
                  confirmTarget.nombres,
                  confirmTarget.apellidoPaterno,
                  confirmTarget.apellidoMaterno ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}".`
            : ""
        }
        confirmText={confirmTarget?.activo ? "Desactivar" : "Reactivar"}
        confirmColor={confirmTarget?.activo ? "warning" : "success"}
      />
    </Box>
  );
}