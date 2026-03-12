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
  createPuesto,
  getPuestos,
  updatePuesto,
  type Puesto,
  type SavePuestoInput,
} from "../api/puestos.api";
import {
  getDepartamentos,
  type Departamento,
} from "../api/departamentos.api";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

const puestoSchema = z.object({
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
  departamentoId: z.coerce
    .number()
    .min(1, "Debes seleccionar un departamento"),
  activo: z.boolean(),
});

type PuestoFormInput = z.input<typeof puestoSchema>;
type PuestoFormValues = z.output<typeof puestoSchema>;

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

function PuestoDialog({
  open,
  onClose,
  onSubmit,
  saving,
  initialValues,
  departamentos,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SavePuestoInput) => Promise<void>;
  saving: boolean;
  initialValues: Puesto | null;
  departamentos: Departamento[];
}) {
  const isEdit = !!initialValues;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PuestoFormInput, unknown, PuestoFormValues>({
    resolver: zodResolver(puestoSchema),
    defaultValues: {
      clave: initialValues?.clave ?? "",
      nombre: initialValues?.nombre ?? "",
      departamentoId: initialValues?.departamentoId ?? 0,
      activo: initialValues?.activo ?? true,
    },
  });

  const activo = watch("activo");

  useEffect(() => {
    reset({
      clave: initialValues?.clave ?? "",
      nombre: initialValues?.nombre ?? "",
      departamentoId: initialValues?.departamentoId ?? 0,
      activo: initialValues?.activo ?? true,
    });
  }, [initialValues, reset, open]);

  const submitForm = async (values: PuestoFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? "Editar puesto" : "Nuevo puesto"}</DialogTitle>

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

          <TextField
            select
            label="Departamento"
            {...register("departamentoId")}
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

export default function PuestosPage() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Puesto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Puesto | null>(null);

  const puestosQuery = useQuery({
    queryKey: ["puestos"],
    queryFn: getPuestos,
  });

  const departamentosQuery = useQuery({
    queryKey: ["departamentos"],
    queryFn: getDepartamentos,
  });

  const departamentos = departamentosQuery.data ?? [];

  const departamentosMap = useMemo(() => {
    return new Map(departamentos.map((d) => [d.id, d]));
  }, [departamentos]);

  const saveMutation = useMutation({
    mutationFn: async (values: SavePuestoInput) => {
      if (editing) {
        return updatePuesto(editing.id, values);
      }

      return createPuesto(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puestos"] });
      setDialogOpen(false);
      setEditing(null);
      showSnackbar(editing ? "Puesto actualizado." : "Puesto creado.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (row: Puesto) => {
      return updatePuesto(row.id, {
        clave: row.clave,
        nombre: row.nombre,
        departamentoId: row.departamentoId,
        activo: !row.activo,
      });
    },
    onSuccess: (_, row) => {
      queryClient.invalidateQueries({ queryKey: ["puestos"] });
      showSnackbar(
        row.activo ? "Puesto desactivado." : "Puesto reactivado.",
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
    const rows = puestosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const departamento = departamentosMap.get(row.departamentoId);
      const departamentoNombre = departamento?.nombre?.toLowerCase() ?? "";

      const departamentoIdMatches = departamentoFilter
        ? row.departamentoId === Number(departamentoFilter)
        : true;

      const searchMatches = !term
        ? true
        : row.clave.toLowerCase().includes(term) ||
          row.nombre.toLowerCase().includes(term) ||
          departamentoNombre.includes(term) ||
          (row.activo ? "activo" : "inactivo").includes(term);

      return departamentoIdMatches && searchMatches;
    });
  }, [puestosQuery.data, search, departamentoFilter, departamentosMap]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Puesto) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const canOpenDialog = departamentos.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Puestos"
        subtitle="Catálogo de puestos vinculados a departamentos."
        actions={[
          {
            label: "Actualizar",
            variant: "outlined",
            startIcon: <RefreshIcon />,
            onClick: () => {
              puestosQuery.refetch();
              departamentosQuery.refetch();
            },
          },
          {
            label: "Nuevo puesto",
            variant: "contained",
            startIcon: <AddIcon />,
            onClick: openCreateDialog,
            disabled: !canOpenDialog,
          },
        ]}
      />

      {!canOpenDialog && !departamentosQuery.isLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Necesitas al menos un departamento activo para registrar puestos.
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 280px" },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              label="Buscar"
              placeholder="Clave, nombre, departamento o estatus"
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
          </Box>

          {puestosQuery.isLoading || departamentosQuery.isLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : puestosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo.{" "}
              {getErrorMessage(puestosQuery.error)}
            </Alert>
          ) : departamentosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo de departamentos.{" "}
              {getErrorMessage(departamentosQuery.error)}
            </Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Clave</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay puestos para mostrar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const departamento = departamentosMap.get(
                        row.departamentoId
                      );

                      return (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.clave}</TableCell>
                          <TableCell>{row.nombre}</TableCell>
                          <TableCell>
                            {departamento
                              ? `${departamento.clave} - ${departamento.nombre}`
                              : row.departamentoId}
                          </TableCell>
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

                            <Tooltip
                              title={row.activo ? "Desactivar" : "Reactivar"}
                            >
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

      <PuestoDialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          setDialogOpen(false);
          setEditing(null);
        }}
        initialValues={editing}
        saving={saveMutation.isPending}
        departamentos={departamentos}
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
        title={confirmTarget?.activo ? "Desactivar puesto" : "Reactivar puesto"}
        message={
          confirmTarget
            ? confirmTarget.activo
              ? `Se desactivará el puesto "${confirmTarget.nombre}".`
              : `Se reactivará el puesto "${confirmTarget.nombre}".`
            : ""
        }
        confirmText={confirmTarget?.activo ? "Desactivar" : "Reactivar"}
        confirmColor={confirmTarget?.activo ? "warning" : "success"}
      />
    </Box>
  );
}