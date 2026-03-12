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
  Stack,
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
  createDepartamento,
  getDepartamentos,
  updateDepartamento,
  type Departamento,
  type SaveDepartamentoInput,
} from "../api/departamentos.api";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
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

    return `${error.response?.status ?? ""} ${error.response?.statusText ?? error.message}`.trim();
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
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
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
                  setValue("activo", checked, { shouldDirty: true })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      setDialogOpen(false);
      setEditing(null);
      showSnackbar(
        editing ? "Departamento actualizado." : "Departamento creado.",
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
    onSuccess: (_, row) => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
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

  const filteredRows = useMemo(() => {
    const rows = departamentosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter(
      (x) =>
        x.clave.toLowerCase().includes(term) ||
        x.nombre.toLowerCase().includes(term) ||
        (x.activo ? "activo" : "inactivo").includes(term)
    );
  }, [departamentosQuery.data, search]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Departamento) => {
    setEditing(row);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
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

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Buscar"
              placeholder="Clave, nombre o estatus"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: "100%", md: 320 } }}
            />
          </Stack>

          {departamentosQuery.isLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : departamentosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo. {getErrorMessage(departamentosQuery.error)}
            </Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Clave</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay departamentos para mostrar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.clave}</TableCell>
                        <TableCell>{row.nombre}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
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