import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
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
  departamentoId: z.coerce.number().min(1, "Debes seleccionar un departamento"),
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
            autoFocus
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

export default function PuestosPage() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Puesto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Puesto | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    return new Map(departamentos.map((d) => [Number(d.id), d]));
  }, [departamentos]);

  const saveMutation = useMutation({
    mutationFn: async (values: SavePuestoInput) => {
      if (editing) {
        return updatePuesto(editing.id, values);
      }

      return createPuesto(values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["puestos"] });
      const wasEdit = !!editing;
      setDialogOpen(false);
      setEditing(null);
      showSnackbar(wasEdit ? "Puesto actualizado." : "Puesto creado.", "success");
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
    onSuccess: async (_, row) => {
      await queryClient.invalidateQueries({ queryKey: ["puestos"] });
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
      const departamento = departamentosMap.get(Number(row.departamentoId));
      const departamentoNombre = departamento?.nombre?.toLowerCase() ?? "";
      const departamentoClave = departamento?.clave?.toLowerCase() ?? "";

      const departamentoMatches = departamentoFilter
        ? Number(row.departamentoId) === Number(departamentoFilter)
        : true;

      const activosMatches = soloActivos ? row.activo : true;

      const searchMatches = !term
        ? true
        : row.clave.toLowerCase().includes(term) ||
          row.nombre.toLowerCase().includes(term) ||
          departamentoNombre.includes(term) ||
          departamentoClave.includes(term) ||
          (row.activo ? "activo" : "inactivo").includes(term);

      return departamentoMatches && activosMatches && searchMatches;
    });
  }, [puestosQuery.data, search, departamentoFilter, soloActivos, departamentosMap]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, departamentoFilter, soloActivos, filteredRows.length]);

  const activeCount = useMemo(
    () => filteredRows.filter((row) => row.activo).length,
    [filteredRows]
  );

  const inactiveCount = useMemo(
    () => filteredRows.filter((row) => !row.activo).length,
    [filteredRows]
  );

  const uniqueDepartamentosCount = useMemo(() => {
    return new Set(
      filteredRows.map((row) => Number(row.departamentoId)).filter((id) => id > 0)
    ).size;
  }, [filteredRows]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Puesto) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const canOpenDialog = departamentos.length > 0;

  const loadingAny =
    puestosQuery.isLoading || departamentosQuery.isLoading;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        title="Puestos"
        subtitle="Catálogo de puestos vinculados a departamentos y estructura operativa."
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
        <Alert severity="warning">
          Necesitas al menos un departamento activo para registrar puestos.
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
          subtitle="Puestos visibles"
          icon={<WorkOutlineRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Activos"
          value={activeCount}
          subtitle="Disponibles para asignación"
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
          title="Departamentos"
          value={uniqueDepartamentosCount}
          subtitle="Con puestos visibles"
          icon={<ApartmentRoundedIcon fontSize="small" />}
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
                Busca por clave, nombre, departamento o estado del puesto.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 280px 220px 180px" },
              gap: 2,
              alignItems: "center",
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
                setDepartamentoFilter("");
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
                Consulta general del catálogo de puestos y su departamento asociado.
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
          ) : puestosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo. {getErrorMessage(puestosQuery.error)}
            </Alert>
          ) : departamentosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el catálogo de departamentos.{" "}
              {getErrorMessage(departamentosQuery.error)}
            </Alert>
          ) : (
            <>
              <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
                <Table stickyHeader size="small">
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
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No hay puestos para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => {
                        const departamento = departamentosMap.get(
                          Number(row.departamentoId)
                        );

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
                              <Typography fontWeight={700}>{row.clave}</Typography>
                            </TableCell>

                            <TableCell>{row.nombre}</TableCell>

                            <TableCell>
                              {departamento ? (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  icon={<ApartmentRoundedIcon />}
                                  label={`${departamento.clave} - ${departamento.nombre}`}
                                />
                              ) : (
                                row.departamentoId
                              )}
                            </TableCell>

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