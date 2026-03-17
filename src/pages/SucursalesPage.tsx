import { useMemo, useState, type ChangeEvent } from "react";
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
  Grid,
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
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSucursal,
  deleteSucursal,
  getSucursales,
  updateSucursal,
  type SucursalCreateDto,
  type SucursalDto,
} from "../api/sucursales.api";

type FormState = {
  clave: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
};

const initialForm: FormState = {
  clave: "",
  nombre: "",
  direccion: "",
  telefono: "",
  activo: true,
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : (error.response?.data as { message?: string } | undefined)?.message;

    return apiMessage || error.message || "Ocurrió un error inesperado.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function normalizePayload(form: FormState): SucursalCreateDto {
  return {
    clave: form.clave.trim().toUpperCase(),
    nombre: form.nombre.trim(),
    direccion: form.direccion.trim() || null,
    telefono: form.telefono.trim() || null,
    activo: form.activo,
  };
}

export default function SucursalesPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SucursalDto | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");

  const queryParams = useMemo(
    () => ({
      activo: soloActivas ? true : undefined,
      q: q.trim() || undefined,
    }),
    [soloActivas, q]
  );

  const sucursalesQuery = useQuery({
    queryKey: ["sucursales", queryParams],
    queryFn: () => getSucursales(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: createSucursal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      handleCloseDialog();
    },
    onError: (error) => {
      setSubmitError(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SucursalCreateDto }) =>
      updateSucursal(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      handleCloseDialog();
    },
    onError: (error) => {
      setSubmitError(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSucursal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const rows = sucursalesQuery.data ?? [];

  function handleOpenCreate() {
    setEditing(null);
    setForm(initialForm);
    setSubmitError("");
    setDialogOpen(true);
  }

  function handleOpenEdit(item: SucursalDto) {
    setEditing(item);
    setForm({
      clave: item.clave,
      nombre: item.nombre,
      direccion: item.direccion ?? "",
      telefono: item.telefono ?? "",
      activo: item.activo,
    });
    setSubmitError("");
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(initialForm);
    setSubmitError("");
  }

  function handleChange(field: keyof FormState) {
    return (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      checked?: boolean
    ) => {
      setForm((prev) => ({
        ...prev,
        [field]:
          field === "activo" ? Boolean(checked) : event.target.value,
      }));
    };
  }

  async function handleSubmit() {
    setSubmitError("");
    setActionError("");

    const payload = normalizePayload(form);

    if (!payload.clave) {
      setSubmitError("La clave es obligatoria.");
      return;
    }

    if (!payload.nombre) {
      setSubmitError("El nombre es obligatorio.");
      return;
    }

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  async function handleDelete(item: SucursalDto) {
    setActionError("");

    const ok = window.confirm(
      `¿Desactivar la sucursal "${item.nombre}"?`
    );

    if (!ok) return;

    await deleteMutation.mutateAsync(item.id);
  }

  const busy =
    createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", lg: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <ApartmentRoundedIcon fontSize="small" />
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Catálogo organizacional
            </Typography>
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, mb: 0.5 }}>
            Sucursales
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Administra las sedes y asigna empleados a su ubicación operativa.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => sucursalesQuery.refetch()}
            disabled={sucursalesQuery.isFetching}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
          >
            {sucursalesQuery.isFetching ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreate}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, boxShadow: "none" }}
          >
            Nueva sucursal
          </Button>
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 4,
          border: "1px solid #e5e7eb",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Buscar"
                placeholder="clave, nombre, dirección o teléfono"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                InputProps={{
                  startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={soloActivas}
                    onChange={(_, checked) => setSoloActivas(checked)}
                  />
                }
                label="Mostrar solo activas"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="text"
                color="inherit"
                startIcon={<ClearRoundedIcon />}
                onClick={() => {
                  setQ("");
                  setSoloActivas(true);
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Limpiar filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {actionError}
        </Alert>
      ) : null}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {sucursalesQuery.isLoading ? (
            <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : sucursalesQuery.isError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{getErrorMessage(sucursalesQuery.error)}</Alert>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Catálogo de sucursales
                  </Typography>

                  <Chip
                    size="small"
                    label={`${rows.length} registro${rows.length === 1 ? "" : "s"}`}
                    variant="outlined"
                  />
                </Stack>
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          backgroundColor: "#f8fafc",
                          color: "#475569",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableCell>Clave</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Dirección</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Empleados activos</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No hay sucursales para los filtros actuales.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.clave}</TableCell>
                          <TableCell>{row.nombre}</TableCell>
                          <TableCell>{row.direccion ?? "-"}</TableCell>
                          <TableCell>{row.telefono ?? "-"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.activo ? "Activa" : "Inactiva"}
                              color={row.activo ? "success" : "default"}
                              variant={row.activo ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>{row.empleadosActivos}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(row)}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Desactivar">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(row)}
                                  disabled={!row.activo || deleteMutation.isPending}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={busy ? undefined : handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? "Editar sucursal" : "Nueva sucursal"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Clave"
                  value={form.clave}
                  onChange={handleChange("clave")}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={form.nombre}
                  onChange={handleChange("nombre")}
                  inputProps={{ maxLength: 150 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={form.direccion}
                  onChange={handleChange("direccion")}
                  inputProps={{ maxLength: 250 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={form.telefono}
                  onChange={handleChange("telefono")}
                  inputProps={{ maxLength: 30 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={handleChange("activo")}
                    />
                  }
                  label="Sucursal activa"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={busy}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={busy}
            sx={{ textTransform: "none", fontWeight: 700, boxShadow: "none" }}
          >
            {busy ? "Guardando..." : editing ? "Guardar cambios" : "Crear sucursal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}