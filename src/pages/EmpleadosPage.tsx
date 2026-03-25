import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
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
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

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
import AppPage from "../components/ui/AppPage";
import EmptyState from "../components/ui/EmptyState";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import { useAuth } from "../features/auth/AuthContext";

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
    }).departamento?.id;

  return Number(maybeDepartamentoId ?? 0);
}

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function hasSomeRole(roles?: string[] | null, allowed: string[] = []) {
  const normalized = normalizeRoles(roles);
  return allowed.some((role) => normalized.includes(role.toUpperCase()));
}

function departmentChipSx() {
  return {
    width: "fit-content",
    borderRadius: "999px",
    fontWeight: 800,
    borderColor: alpha("#2563eb", 0.24),
    color: "#1d4ed8",
    backgroundColor: alpha("#2563eb", 0.04),
    "& .MuiChip-icon": {
      color: "#2563eb",
    },
  } as const;
}

function empleadoStatusChipSx(activo: boolean) {
  return {
    fontWeight: 800,
    borderRadius: "999px",
    color: activo ? "#166534" : "#991b1b",
    borderColor: activo
      ? alpha("#16a34a", 0.22)
      : alpha("#dc2626", 0.22),
    backgroundColor: activo
      ? alpha("#16a34a", 0.05)
      : alpha("#dc2626", 0.05),
  } as const;
}

function actionIconButtonSx(
  variant: "view" | "edit" | "toggle-active" | "toggle-inactive"
) {
  const map = {
    view: {
      color: "#0f766e",
      border: alpha("#0f766e", 0.16),
      bg: alpha("#0f766e", 0.05),
      hover: alpha("#0f766e", 0.1),
    },
    edit: {
      color: "#1d4ed8",
      border: alpha("#1d4ed8", 0.16),
      bg: alpha("#1d4ed8", 0.05),
      hover: alpha("#1d4ed8", 0.1),
    },
    "toggle-active": {
      color: "#b45309",
      border: alpha("#b45309", 0.18),
      bg: alpha("#b45309", 0.05),
      hover: alpha("#b45309", 0.1),
    },
    "toggle-inactive": {
      color: "#15803d",
      border: alpha("#15803d", 0.18),
      bg: alpha("#15803d", 0.05),
      hover: alpha("#15803d", 0.1),
    },
  }[variant];

  return {
    width: 34,
    height: 34,
    borderRadius: "12px",
    border: `1px solid ${map.border}`,
    color: map.color,
    backgroundColor: map.bg,
    "&:hover": {
      backgroundColor: map.hover,
    },
  } as const;
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
    handleSubmit,
    reset,
    watch,
    setValue,
    register,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const { roles } = useAuth();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [sucursalFilter, setSucursalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Empleado | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canManageEmpleados = hasSomeRole(roles, ["ADMIN", "RRHH"]);

  const empleadosQuery = useQuery<Empleado[], Error>({
    queryKey: ["empleados"],
    queryFn: () => getEmpleados(),
  });

  const departamentosQuery = useQuery<Departamento[], Error>({
    queryKey: ["departamentos"],
    queryFn: () => getDepartamentos(),
  });

  const puestosQuery = useQuery<Puesto[], Error>({
    queryKey: ["puestos"],
    queryFn: () => getPuestos(),
  });

  const sucursalesQuery = useQuery<SucursalDto[], Error>({
    queryKey: ["sucursales-select"],
    queryFn: () => getSucursales({ activo: true }),
  });

  const departamentos: Departamento[] = departamentosQuery.data ?? [];
  const puestos: Puesto[] = puestosQuery.data ?? [];
  const sucursales: SucursalDto[] = sucursalesQuery.data ?? [];

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
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
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
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
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

  const filteredRows = useMemo<Empleado[]>(() => {
    const rows: Empleado[] = empleadosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    return rows.filter((row: Empleado) => {
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

  const paginatedRows = useMemo<Empleado[]>(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, departamentoFilter, sucursalFilter, statusFilter, filteredRows.length]);

  const activeCount = useMemo(
    () => filteredRows.filter((row: Empleado) => row.activo).length,
    [filteredRows]
  );

  const inactiveCount = useMemo(
    () => filteredRows.filter((row: Empleado) => !row.activo).length,
    [filteredRows]
  );

  const assignedBranchCount = useMemo(() => {
    return new Set(
      filteredRows
        .map((row: Empleado) => row.sucursalId)
        .filter((value): value is number => Number(value) > 0)
    ).size;
  }, [filteredRows]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (departamentoFilter) count += 1;
    if (sucursalFilter) count += 1;
    if (statusFilter) count += 1;
    return count;
  }, [search, departamentoFilter, sucursalFilter, statusFilter]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Empleado) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const openExpediente = (row: Empleado) => {
    navigate(`/empleados/${row.id}/expediente`);
  };

  const canOpenDialog =
    canManageEmpleados &&
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

  const isRefreshing =
    (empleadosQuery.isFetching ||
      departamentosQuery.isFetching ||
      puestosQuery.isFetching ||
      sucursalesQuery.isFetching) &&
    !loadingAny;

  const handleRefresh = () => {
    void empleadosQuery.refetch();
    void departamentosQuery.refetch();
    void puestosQuery.refetch();
    void sucursalesQuery.refetch();
  };

  const clearFilters = () => {
    setSearch("");
    setDepartamentoFilter("");
    setSucursalFilter("");
    setStatusFilter("");
  };

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Empleados"
      subtitle="Catálogo operativo del personal registrado, con relación a departamentos, puestos y sucursales."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loadingAny || saveMutation.isPending || toggleMutation.isPending}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>

          {canManageEmpleados && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              disabled={!canOpenDialog}
            >
              Nuevo empleado
            </Button>
          )}
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de empleados"
        subtitle="Consulta general del personal, su asignación organizacional y su estado operativo actual dentro del sistema."
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.18),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 800,
                  }}
                />
              ))
            ) : (
              <Chip
                label="Sin roles detectados"
                size="small"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.18),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        }
        aside={
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {filteredRows.length}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  visibles
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {activeCount}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  activos
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {activeFiltersCount}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  filtros
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              {canOpenDialog
                ? "Catálogos base disponibles para alta y edición."
                : canManageEmpleados
                ? "Faltan catálogos base para permitir nuevas altas."
                : "Consulta disponible según tu rol actual."}
            </Typography>
          </Stack>
        }
      />

      {canManageEmpleados &&
        !canOpenDialog &&
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
          gap: { xs: 2, md: 2.25 },
        }}
      >
        <MetricCard
          title="Total"
          value={filteredRows.length}
          subtitle="Empleados visibles"
          icon={<Groups2OutlinedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Activos"
          value={activeCount}
          subtitle="Personal vigente"
          icon={<PersonAddAlt1RoundedIcon fontSize="small" />}
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

      <SectionCard
        title="Filtros"
        subtitle="Busca por empleado, correo, puesto, sucursal o estatus."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              color={activeFiltersCount > 0 ? "primary" : undefined}
              label={
                activeFiltersCount > 0
                  ? `${activeFiltersCount} filtro${
                      activeFiltersCount > 1 ? "s" : ""
                    } activo${activeFiltersCount > 1 ? "s" : ""}`
                  : "Sin filtros"
              }
            />
            <Button
              size="small"
              variant="outlined"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              Limpiar
            </Button>
          </Stack>
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(12, 1fr)",
            },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 5" } }}>
            <TextField
              label="Buscar"
              placeholder="No. empleado, nombre, correo, puesto, sucursal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
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
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
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
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
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
        </Box>
      </SectionCard>

      <SectionCard
        title="Listado"
        subtitle="Consulta general del catálogo de empleados y su asignación actual."
        actions={
          <Chip
            label={`${paginatedRows.length} visibles de ${filteredRows.length}`}
            size="small"
            variant="outlined"
          />
        }
      >
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
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={<Groups2OutlinedIcon sx={{ fontSize: 52 }} />}
            title="No hay empleados para mostrar"
            description="No se encontraron registros con los filtros actuales. Ajusta la búsqueda o registra un nuevo empleado."
            actionLabel={canManageEmpleados ? "Nuevo empleado" : undefined}
            onAction={canManageEmpleados ? openCreateDialog : undefined}
          />
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      zIndex: 2,
                    },
                  }}
                >
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
                  {paginatedRows.map((row: Empleado) => {
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
                          <Typography fontWeight={700}>{row.numEmpleado}</Typography>
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
                            <Tooltip
                              arrow
                              title={`${departamento.clave} - ${departamento.nombre}`}
                            >
                              <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  icon={<ApartmentOutlinedIcon />}
                                  label={departamento.clave}
                                  sx={departmentChipSx()}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "block",
                                    maxWidth: 180,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {departamento.nombre}
                                </Typography>
                              </Stack>
                            </Tooltip>
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
                            variant="outlined"
                            label={row.activo ? "Activo" : "Inactivo"}
                            sx={empleadoStatusChipSx(row.activo)}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            justifyContent="flex-end"
                          >
                            {canManageEmpleados && (
                              <Tooltip title="Expediente">
                                <IconButton
                                  onClick={() => openExpediente(row)}
                                  sx={actionIconButtonSx("view")}
                                  disabled={saveMutation.isPending || toggleMutation.isPending}
                                >
                                  <FolderOpenRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canManageEmpleados && (
                              <Tooltip title="Editar">
                                <IconButton
                                  onClick={() => openEditDialog(row)}
                                  sx={actionIconButtonSx("edit")}
                                  disabled={saveMutation.isPending || toggleMutation.isPending}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canManageEmpleados && (
                              <Tooltip title={row.activo ? "Desactivar" : "Reactivar"}>
                                <IconButton
                                  onClick={() => setConfirmTarget(row)}
                                  sx={actionIconButtonSx(
                                    row.activo ? "toggle-active" : "toggle-inactive"
                                  )}
                                  disabled={saveMutation.isPending || toggleMutation.isPending}
                                >
                                  {row.activo ? (
                                    <BlockRoundedIcon fontSize="small" />
                                  ) : (
                                    <CheckCircleRoundedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(
                e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
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
      </SectionCard>

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
    </AppPage>
  );
}