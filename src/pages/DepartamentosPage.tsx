import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
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

  useEffect(() => {
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

    if (!term) return rows;

    return rows.filter(
      (x) =>
        x.clave.toLowerCase().includes(term) ||
        x.nombre.toLowerCase().includes(term) ||
        (x.activo ? "activo" : "inactivo").includes(term)
    );
  }, [rows, search]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Departamento) => {
    setEditing(row);
    setDialogOpen(true);
  };

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
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.activo ? "Activo" : "Inactivo"}
            color={params.row.activo ? "success" : "default"}
            sx={{
              fontWeight: 700,
              borderRadius: 999,
            }}
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
              <IconButton
                size="small"
                onClick={() => openEditDialog(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={params.row.activo ? "Desactivar" : "Reactivar"}>
              <IconButton
                size="small"
                onClick={() => setConfirmTarget(params.row)}
              >
                <SyncAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  const isLoading =
    departamentosQuery.isLoading ||
    departamentosQuery.isFetching ||
    saveMutation.isPending ||
    toggleMutation.isPending;

  const emptyTitle = search.trim()
    ? "No hay coincidencias"
    : "No hay departamentos";

  const emptyMessage = search.trim()
    ? "No encontramos departamentos con ese criterio de búsqueda."
    : "Captura el primer departamento para empezar.";

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Departamentos"
        subtitle="Catálogo de departamentos de RH."
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

      {departamentosQuery.isError && (
        <Alert severity="error">
          No se pudo cargar el catálogo.{" "}
          {getErrorMessage(departamentosQuery.error)}
        </Alert>
      )}

      <ReusableDataTable<Departamento>
        rows={filteredRows}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        minHeight={190}
        maxHeight={320}
        initialPageSize={5}
        toolbar={
          <TextField
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />
        }
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyAction={
          !search.trim() ? (
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
    </Stack>
  );
}