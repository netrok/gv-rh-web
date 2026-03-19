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
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
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
import { getSucursales, type SucursalDto } from "../api/sucursales.api";
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
  sucursalId: z.coerce.number().min(0),
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

    return `${error.response?.status ?? ""} ${
      error.response?.statusText ?? error.message
    }`.trim();
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

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        height: "100%",
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mt: 0.75, lineHeight: 1 }}
            >
              {value}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          </Box>

          <Stack alignItems="flex-end" spacing={1}>
            {badge ? (
              <Chip size="small" label={badge} color="primary" variant="outlined" />
            ) : null}

            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "action.hover",
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmpleadoDialog({
  open,
  onClose,
  onSubmit,
  saving,
  initialValues,
  departamentos,
  puestos,
  sucursales,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SaveEmpleadoInput) => Promise<void>;
  saving: boolean;
  initialValues: Empleado | null;
  departamentos: Departamento[];
  puestos: Puesto[];
  sucursales: SucursalDto[];
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
      sucursalId: initialValues?.sucursalId ?? 0,
    },
  });

  const activo = watch("activo");
  const departamentoId = Number(watch("departamentoId") ?? 0);
  const puestoId = Number(watch("puestoId") ?? 0);
  const sucursalId = Number(watch("sucursalId") ?? 0);

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
      sucursalId: initialValues?.sucursalId ?? 0,
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
      sucursalId: Number(values.sucursalId) > 0 ? Number(values.sucursalId) : null,
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

          <TextField
            select
            label="Sucursal"
            value={sucursalId}
            onChange={(e) => {
              setValue("sucursalId", Number(e.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            error={!!errors.sucursalId}
            helperText={errors.sucursalId?.message}
          >
            <MenuItem value={0}>Sin sucursal</MenuItem>
            {sucursales.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                {sucursal.clave} - {sucursal.nombre}
              </MenuItem>
            ))}
          </TextField>

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
  const [sucursalFilter, setSucursalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Empleado | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const sucursalesQuery = useQuery({
    queryKey: ["sucursales-select"],
    queryFn: () => getSucursales({ activo: true }),
  });

  const departamentos = departamentosQuery.data ?? [];
  const puestos = puestosQuery.data ?? [];
  const sucursales = sucursalesQuery.data ?? [];

  const departamentosMap = useMemo(() => {
    return new Map(departamentos.map((d) => [Number(d.id), d]));
  }, [departamentos]);

  const puestosMap = useMemo(() => {
    return new Map(puestos.map((p) => [Number(p.id), p]));
  }, [puestos]);

  const sucursalesMap = useMemo(() => {
    return new Map(sucursales.map((s) => [Number(s.id), s]));
  }, [sucursales]);

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
        sucursalId: row.sucursalId ?? null,
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
      const sucursal = row.sucursalId
        ? sucursalesMap.get(Number(row.sucursalId))
        : undefined;

      const matchesDepartamento = departamentoFilter
        ? Number(row.departamentoId) === Number(departamentoFilter)
        : true;

      const matchesSucursal = sucursalFilter
        ? Number(row.sucursalId) === Number(sucursalFilter)
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
          (sucursal?.nombre ?? "").toLowerCase().includes(term) ||
          (sucursal?.clave ?? "").toLowerCase().includes(term) ||
          (row.activo ? "activo" : "inactivo").includes(term);

      return (
        matchesDepartamento &&
        matchesSucursal &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    empleadosQuery.data,
    search,
    departamentoFilter,
    sucursalFilter,
    statusFilter,
    departamentosMap,
    puestosMap,
    sucursalesMap,
  ]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, departamentoFilter, sucursalFilter, statusFilter, filteredRows.length]);

  const activeCount = useMemo(
    () => filteredRows.filter((row) => row.activo).length,
    [filteredRows]
  );

  const inactiveCount = useMemo(
    () => filteredRows.filter((row) => !row.activo).length,
    [filteredRows]
  );

  const assignedBranchCount = useMemo(() => {
    return new Set(
      filteredRows
        .map((row) => row.sucursalId)
        .filter((value): value is number => Number(value) > 0)
    ).size;
  }, [filteredRows]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Empleado) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const canOpenDialog =
    departamentos.length > 0 &&
    puestos.length > 0 &&
    !departamentosQuery.isLoading &&
    !puestosQuery.isLoading &&
    !sucursalesQuery.isLoading;

  const loadingAny =
    empleadosQuery.isLoading ||
    departamentosQuery.isLoading ||
    puestosQuery.isLoading ||
    sucursalesQuery.isLoading;

  const handleRefresh = () => {
    empleadosQuery.refetch();
    departamentosQuery.refetch();
    puestosQuery.refetch();
    sucursalesQuery.refetch();
  };

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        title="Empleados"
        subtitle="Catálogo operativo del personal registrado en RH."
        actions={[
          {
            label: "Actualizar",
            variant: "outlined",
            startIcon: <RefreshIcon />,
            onClick: handleRefresh,
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
        !puestosQuery.isLoading &&
        !sucursalesQuery.isLoading && (
          <Alert severity="warning">
            Necesitas departamentos y puestos registrados para crear empleados.
          </Alert>
        )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <MetricCard
          title="Total"
          value={filteredRows.length}
          subtitle="Empleados visibles"
          icon={<BadgeRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Activos"
          value={activeCount}
          subtitle="Personal vigente"
          icon={<BadgeRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Inactivos"
          value={inactiveCount}
          subtitle="Bajas o suspendidos"
          icon={<PersonOffRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Sucursales"
          value={assignedBranchCount}
          subtitle="Con personal asignado"
          icon={<StoreRoundedIcon fontSize="small" />}
          badge="RH"
        />
      </Box>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 2 }}
          >
            <SearchRoundedIcon fontSize="small" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Busca por empleado, correo, puesto, sucursal o estatus.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 260px 260px 180px",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Buscar"
              placeholder="No. empleado, nombre, correo, puesto, sucursal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <TextField
              select
              label="Departamento"
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
              label="Sucursal"
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {sucursales.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  {sucursal.clave} - {sucursal.nombre}
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
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Listado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consulta general del catálogo de empleados y su asignación actual.
              </Typography>
            </Box>

            <Chip
              label={`${paginatedRows.length} visibles de ${filteredRows.length}`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {loadingAny ? (
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
          ) : sucursalesQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo de sucursales.{" "}
              {getErrorMessage(sucursalesQuery.error)}
            </Alert>
          ) : (
            <>
              <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>No. Empleado</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Departamento</TableCell>
                      <TableCell>Puesto</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell>Ingreso</TableCell>
                      <TableCell>Estatus</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No hay empleados para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => {
                        const departamento = row.departamentoId
                          ? departamentosMap.get(Number(row.departamentoId))
                          : undefined;
                        const puesto = row.puestoId
                          ? puestosMap.get(Number(row.puestoId))
                          : undefined;
                        const sucursal = row.sucursalId
                          ? sucursalesMap.get(Number(row.sucursalId))
                          : undefined;

                        return (
                          <TableRow
                            key={row.id}
                            hover
                            sx={{
                              backgroundColor: row.activo
                                ? "transparent"
                                : "rgba(0,0,0,0.02)",
                            }}
                          >
                            <TableCell>{row.id}</TableCell>

                            <TableCell>
                              <Typography fontWeight={700}>
                                {row.numEmpleado}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography fontWeight={700}>
                                  {[row.nombres, row.apellidoPaterno, row.apellidoMaterno ?? ""]
                                    .filter(Boolean)
                                    .join(" ")}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.email || "Sin correo"}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              {departamento ? (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  icon={<ApartmentRoundedIcon />}
                                  label={`${departamento.clave} - ${departamento.nombre}`}
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>

                            <TableCell>
                              {puesto ? `${puesto.clave} - ${puesto.nombre}` : "-"}
                            </TableCell>

                            <TableCell>
                              {sucursal
                                ? `${sucursal.clave} - ${sucursal.nombre}`
                                : row.sucursalNombre ?? "-"}
                            </TableCell>

                            <TableCell>{formatDate(row.fechaIngreso)}</TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                label={row.activo ? "Activo" : "Inactivo"}
                                color={row.activo ? "success" : "default"}
                                variant={row.activo ? "filled" : "outlined"}
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

              <TablePagination
                component="div"
                count={filteredRows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </>
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
        sucursales={sucursales}
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