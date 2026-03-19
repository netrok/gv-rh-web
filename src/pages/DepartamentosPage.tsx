import { useCallback, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createDepartamento,
  getDepartamentos,
  updateDepartamento,
  type Departamento,
  type SaveDepartamentoInput,
} from "../api/departamentos.api";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ReusableDataTable from "../components/ui/ReusableDataTable";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

const departamentoSchema = z.object({
  clave: z
    .string()
    .min(1, "La clave es obligatoria")
    .max(20, "Máximo 20 caracteres")
    .transform((v) => v.trim().toUpperCase()),
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(150, "Máximo 150 caracteres")
    .transform((v) => v.trim()),
  activo: z.boolean(),
});

type DepartamentoForm = z.infer<typeof departamentoSchema>;

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
  icon: ReactNode;
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

function DepartamentoDialog({
  open,
  onClose,
  onSubmit,
  saving,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SaveDepartamentoInput) => Promise<void>;
  saving: boolean;
  initialValues: Departamento | null;
}) {
  const isEdit = !!initialValues;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DepartamentoForm>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      clave: initialValues?.clave ?? "",
      nombre: initialValues?.nombre ?? "",
      activo: initialValues?.activo ?? true,
    },
  });

  const activo = watch("activo");

  useMemo(() => {
    reset({
      clave: initialValues?.clave ?? "",
      nombre: initialValues?.nombre ?? "",
      activo: initialValues?.activo ?? true,
    });
  }, [initialValues, reset, open]);

  const submitForm = async (values: DepartamentoForm) => {
    await onSubmit(values);
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? "Editar departamento" : "Nuevo departamento"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack
          component="form"
          spacing={2}
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(submitForm)}
        >
          <TextField
            label="Clave"
            {...register("clave")}
            error={!!errors.clave}
            helperText={errors.clave?.message}
            autoFocus
          />

          <TextField
            label="Nombre"
            {...register("nombre")}
            error={!!errors.nombre}
            helperText={errors.nombre?.message}
          />

          <FormControlLabel
            control={
              <Switch
                checked={activo}
                onChange={(_, checked) =>
                  setValue("activo", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            }
            label={activo ? "Activo" : "Inactivo"}
          />
        </Stack>
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

export default function DepartamentosPage() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [search, setSearch] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Departamento | null>(null);

  const departamentosQuery = useQuery({
    queryKey: ["departamentos"],
    queryFn: getDepartamentos,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: SaveDepartamentoInput) => {
      if (editing) {
        return updateDepartamento(editing.id, values);
      }
      return createDepartamento(values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departamentos"] });

      const wasEdit = !!editing;
      setDialogOpen(false);
      setEditing(null);

      showSnackbar(
        wasEdit ? "Departamento actualizado." : "Departamento creado.",
        "success"
      );
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (row: Departamento) => {
      return updateDepartamento(row.id, {
        clave: row.clave,
        nombre: row.nombre,
        activo: !row.activo,
      });
    },
    onSuccess: async (_, row) => {
      await queryClient.invalidateQueries({ queryKey: ["departamentos"] });

      showSnackbar(
        row.activo ? "Departamento desactivado." : "Departamento reactivado.",
        "success"
      );

      setConfirmTarget(null);
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
      setConfirmTarget(null);
    },
  });

  const rows = departamentosQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((x) => {
      const matchesSearch = !term
        ? true
        : x.clave.toLowerCase().includes(term) ||
          x.nombre.toLowerCase().includes(term) ||
          (x.activo ? "activo" : "inactivo").includes(term);

      const matchesStatus = soloActivos ? x.activo : true;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, soloActivos]);

  const activeCount = useMemo(
    () => rows.filter((row) => row.activo).length,
    [rows]
  );

  const inactiveCount = useMemo(
    () => rows.filter((row) => !row.activo).length,
    [rows]
  );

  const openCreateDialog = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((row: Departamento) => {
    setEditing(row);
    setDialogOpen(true);
  }, []);

  const columns = useMemo<GridColDef<Departamento>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 90,
      },
      {
        field: "clave",
        headerName: "Clave",
        width: 140,
      },
      {
        field: "nombre",
        headerName: "Nombre",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "activo",
        headerName: "Estatus",
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.activo ? "Activo" : "Inactivo"}
            color={params.row.activo ? "success" : "default"}
            variant={params.row.activo ? "filled" : "outlined"}
            sx={{ fontWeight: 700, borderRadius: 999 }}
          />
        ),
      },
      {
        field: "acciones",
        headerName: "Acciones",
        width: 150,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => openEditDialog(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={params.row.activo ? "Desactivar" : "Reactivar"}>
              <IconButton size="small" onClick={() => setConfirmTarget(params.row)}>
                <SyncAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [openEditDialog]
  );

  const tableLoading =
    departamentosQuery.isLoading ||
    saveMutation.isPending ||
    toggleMutation.isPending;

  const emptyTitle = search.trim() || soloActivos
    ? "No hay coincidencias"
    : "No hay departamentos";

  const emptyMessage = search.trim() || soloActivos
    ? "No encontramos departamentos con los filtros actuales."
    : "Captura el primer departamento para empezar.";

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        title="Departamentos"
        subtitle="Catálogo organizacional de áreas y estructuras internas de RH."
        actions={[
          {
            label: "Actualizar",
            variant: "outlined",
            startIcon: <RefreshIcon />,
            onClick: () => departamentosQuery.refetch(),
          },
          {
            label: "Nuevo departamento",
            variant: "contained",
            startIcon: <AddIcon />,
            onClick: openCreateDialog,
          },
        ]}
      />

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
          value={rows.length}
          subtitle="Departamentos registrados"
          icon={<ApartmentRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Activos"
          value={activeCount}
          subtitle="Disponibles para operación"
          icon={<CheckCircleRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Inactivos"
          value={inactiveCount}
          subtitle="Deshabilitados"
          icon={<DoNotDisturbOnRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Visibles"
          value={filteredRows.length}
          subtitle="Resultado con filtros actuales"
          icon={<BadgeRoundedIcon fontSize="small" />}
          badge="RH"
        />
      </Box>

      {departamentosQuery.isError && (
        <Alert severity="error">
          No se pudo cargar el catálogo. {getErrorMessage(departamentosQuery.error)}
        </Alert>
      )}

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
                Busca por clave, nombre o estado del departamento.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 220px 180px",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Buscar por clave, nombre o estado"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={soloActivos}
                  onChange={(_, checked) => setSoloActivos(checked)}
                />
              }
              label="Mostrar solo activos"
            />

            <Button
              variant="text"
              color="inherit"
              onClick={() => {
                setSearch("");
                setSoloActivos(false);
              }}
              sx={{ textTransform: "none", fontWeight: 700, justifySelf: "start" }}
            >
              Limpiar filtros
            </Button>
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
                Consulta general del catálogo de departamentos.
              </Typography>
            </Box>

            <Chip
              label={`${filteredRows.length} registro${
                filteredRows.length === 1 ? "" : "s"
              }`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <ReusableDataTable<Departamento>
            rows={filteredRows}
            columns={columns}
            loading={tableLoading}
            getRowId={(row) => row.id}
            minHeight={220}
            maxHeight={420}
            initialPageSize={5}
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
            emptyAction={
              !search.trim() && !soloActivos ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                >
                  Crear departamento
                </Button>
              ) : undefined
            }
          />
        </CardContent>
      </Card>

      <DepartamentoDialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          setDialogOpen(false);
          setEditing(null);
        }}
        initialValues={editing}
        saving={saveMutation.isPending}
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
        title={
          confirmTarget?.activo
            ? "Desactivar departamento"
            : "Reactivar departamento"
        }
        message={
          confirmTarget
            ? confirmTarget.activo
              ? `Se desactivará el departamento "${confirmTarget.nombre}".`
              : `Se reactivará el departamento "${confirmTarget.nombre}".`
            : ""
        }
        confirmText={confirmTarget?.activo ? "Desactivar" : "Reactivar"}
        confirmColor={confirmTarget?.activo ? "warning" : "success"}
      />
    </Box>
  );
}