import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import PageHeader from "../components/ui/PageHeader";
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

export default function SucursalesPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SucursalDto | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [q, soloActivas, rows.length]);

  const activeCount = useMemo(
    () => rows.filter((row) => row.activo).length,
    [rows]
  );

  const inactiveCount = useMemo(
    () => rows.filter((row) => !row.activo).length,
    [rows]
  );

  const empleadosActivosTotal = useMemo(
    () => rows.reduce((acc, row) => acc + Number(row.empleadosActivos || 0), 0),
    [rows]
  );

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
        [field]: field === "activo" ? Boolean(checked) : event.target.value,
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

    const ok = window.confirm(`¿Desactivar la sucursal "${item.nombre}"?`);
    if (!ok) return;

    await deleteMutation.mutateAsync(item.id);
  }

  const busy = createMutation.isPending || updateMutation.isPending;
  const loading = sucursalesQuery.isLoading;
  const fetching = sucursalesQuery.isFetching;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        title="Sucursales"
        subtitle="Administra las sedes y su disponibilidad operativa dentro del sistema."
        actions={[
          {
            label: fetching ? "Actualizando..." : "Actualizar",
            variant: "outlined",
            startIcon: <RefreshRoundedIcon />,
            onClick: () => sucursalesQuery.refetch(),
            disabled: fetching,
          },
          {
            label: "Nueva sucursal",
            variant: "contained",
            startIcon: <AddRoundedIcon />,
            onClick: handleOpenCreate,
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
          subtitle="Sucursales visibles"
          icon={<StoreRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Activas"
          value={activeCount}
          subtitle="Operando en sistema"
          icon={<CheckCircleRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Inactivas"
          value={inactiveCount}
          subtitle="Deshabilitadas"
          icon={<DoNotDisturbOnRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Empleados activos"
          value={empleadosActivosTotal}
          subtitle="Suma en sucursales visibles"
          icon={<GroupsRoundedIcon fontSize="small" />}
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
                Busca por clave, nombre, dirección o teléfono y filtra el estado.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 280px 180px",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label="Buscar"
              placeholder="clave, nombre, dirección o teléfono"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={soloActivas}
                  onChange={(_, checked) => setSoloActivas(checked)}
                />
              }
              label="Mostrar solo activas"
            />

            <Button
              variant="text"
              color="inherit"
              startIcon={<ClearRoundedIcon />}
              onClick={() => {
                setQ("");
                setSoloActivas(true);
              }}
              sx={{ textTransform: "none", fontWeight: 700, justifySelf: "start" }}
            >
              Limpiar filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

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
                Catálogo de sucursales
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisión general de sedes, estado y personal activo asignado.
              </Typography>
            </Box>

            <Chip
              size="small"
              variant="outlined"
              label={`${paginatedRows.length} visibles de ${rows.length}`}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : sucursalesQuery.isError ? (
            <Alert severity="error">{getErrorMessage(sucursalesQuery.error)}</Alert>
          ) : (
            <>
              <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
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
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No hay sucursales para los filtros actuales.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            backgroundColor: row.activo
                              ? "transparent"
                              : "rgba(0,0,0,0.02)",
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={700}>{row.clave}</Typography>
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography fontWeight={700}>{row.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID #{row.id}
                              </Typography>
                            </Stack>
                          </TableCell>

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

              <TablePagination
                component="div"
                count={rows.length}
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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "160px 1fr" },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Clave"
                value={form.clave}
                onChange={handleChange("clave")}
                inputProps={{ maxLength: 20 }}
              />

              <TextField
                fullWidth
                label="Nombre"
                value={form.nombre}
                onChange={handleChange("nombre")}
                inputProps={{ maxLength: 150 }}
              />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={form.direccion}
                  onChange={handleChange("direccion")}
                  inputProps={{ maxLength: 250 }}
                />
              </Box>

              <TextField
                fullWidth
                label="Teléfono"
                value={form.telefono}
                onChange={handleChange("telefono")}
                inputProps={{ maxLength: 30 }}
              />

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={handleChange("activo")}
                    />
                  }
                  label="Sucursal activa"
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={busy}>
            Cancelar
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={busy}>
            {busy ? "Guardando..." : editing ? "Guardar cambios" : "Crear sucursal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}