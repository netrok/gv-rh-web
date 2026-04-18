import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuth } from "../features/auth/AuthContext";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import {
  createSucursal,
  deleteSucursal,
  downloadBlobFile,
  exportSucursalesPdf,
  exportSucursalesXlsx,
  getFileNameFromDisposition,
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

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role) => String(role).trim().toUpperCase());
}

function sucursalStatusChipSx(activo: boolean) {
  if (activo) {
    return {
      bgcolor: "rgba(46, 125, 50, 0.10)",
      color: "success.dark",
      borderColor: "rgba(46, 125, 50, 0.34)",
      fontWeight: 800,
    };
  }

  return {
    bgcolor: "rgba(100, 116, 139, 0.08)",
    color: "text.secondary",
    borderColor: "rgba(100, 116, 139, 0.24)",
    fontWeight: 800,
  };
}

function actionIconButtonSx(kind: "edit" | "delete") {
  if (kind === "edit") {
    return {
      width: 36,
      height: 36,
      borderRadius: "12px",
      border: `1px solid ${alpha("#1d4ed8", 0.14)}`,
      backgroundColor: alpha("#1d4ed8", 0.05),
      color: "#1d4ed8",
      "&:hover": {
        backgroundColor: alpha("#1d4ed8", 0.10),
        borderColor: alpha("#1d4ed8", 0.24),
      },
    };
  }

  return {
    width: 36,
    height: 36,
    borderRadius: "12px",
    border: `1px solid ${alpha("#dc2626", 0.14)}`,
    backgroundColor: alpha("#dc2626", 0.05),
    color: "#dc2626",
    "&:hover": {
      backgroundColor: alpha("#dc2626", 0.10),
      borderColor: alpha("#dc2626", 0.24),
    },
  };
}

function filterToggleBoxSx() {
  return {
    minHeight: 40,
    px: 1.25,
    borderRadius: "14px",
    border: `1px solid ${alpha("#0f172a", 0.08)}`,
    backgroundColor: alpha("#0f172a", 0.02),
    display: "flex",
    alignItems: "center",
  };
}

function exportButtonSx(kind: "xlsx" | "pdf") {
  if (kind === "xlsx") {
    return {
      borderColor: alpha("#15803d", 0.22),
      color: "#166534",
      backgroundColor: alpha("#15803d", 0.04),
      "&:hover": {
        borderColor: alpha("#15803d", 0.34),
        backgroundColor: alpha("#15803d", 0.08),
      },
    };
  }

  return {
    borderColor: alpha("#b91c1c", 0.20),
    color: "#b91c1c",
    backgroundColor: alpha("#b91c1c", 0.04),
    "&:hover": {
      borderColor: alpha("#b91c1c", 0.32),
      backgroundColor: alpha("#b91c1c", 0.08),
    },
  };
}

export default function SucursalesPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { showSnackbar } = useAppSnackbar();

  const [q, setQ] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SucursalDto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<SucursalDto | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitError, setSubmitError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "pdf" | null>(
    null
  );

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

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
      showSnackbar("Sucursal creada.", "success");
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
      showSnackbar("Sucursal actualizada.", "success");
    },
    onError: (error) => {
      setSubmitError(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSucursal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      setConfirmTarget(null);
      showSnackbar("Sucursal desactivada.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
      setConfirmTarget(null);
    },
  });

  const rows = sucursalesQuery.data ?? [];

  const reportFilters = useMemo(
    () => ({
      activo: soloActivas ? true : undefined,
      q: q.trim() || undefined,
    }),
    [soloActivas, q]
  );

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count += 1;
    if (soloActivas) count += 1;
    return count;
  }, [q, soloActivas]);

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

  async function handleExport(format: "xlsx" | "pdf") {
    try {
      setExportingFormat(format);

      const response =
        format === "xlsx"
          ? await exportSucursalesXlsx(reportFilters)
          : await exportSucursalesPdf(reportFilters);

      const fallback = format === "xlsx" ? "sucursales.xlsx" : "sucursales.pdf";

      const fileName = getFileNameFromDisposition(
        response.headers["content-disposition"],
        fallback
      );

      downloadBlobFile(response.data, fileName);

      showSnackbar(
        format === "xlsx"
          ? "Reporte Excel descargado."
          : "Reporte PDF descargado.",
        "success"
      );
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setExportingFormat(null);
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending;
  const loading =
    sucursalesQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;
  const fetching = sucursalesQuery.isFetching;

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Sucursales"
      subtitle="Administra las sedes, su disponibilidad operativa y la base territorial del sistema."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => sucursalesQuery.refetch()}
            disabled={fetching || exportingFormat !== null}
          >
            {fetching ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<GridOnRoundedIcon />}
            onClick={() => void handleExport("xlsx")}
            disabled={loading || exportingFormat !== null}
            sx={exportButtonSx("xlsx")}
          >
            {exportingFormat === "xlsx" ? "Exportando..." : "Excel"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={() => void handleExport("pdf")}
            disabled={loading || exportingFormat !== null}
            sx={exportButtonSx("pdf")}
          >
            {exportingFormat === "pdf" ? "Exportando..." : "PDF"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreate}
            disabled={exportingFormat !== null}
          >
            Nueva sucursal
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de sucursales"
        subtitle="Controla las sedes del sistema, su estado operativo y la referencia de personal asignado por ubicación."
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
                  {rows.length}
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
                  activas
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Base territorial lista para asignar personal y operar catálogos.
            </Typography>
          </Stack>
        }
      />

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

      {sucursalesQuery.isError ? (
        <Alert severity="error">{getErrorMessage(sucursalesQuery.error)}</Alert>
      ) : null}

      <SectionCard
        title="Filtros"
        subtitle="Busca por clave, nombre, dirección o teléfono y filtra el estado."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={
              activeFiltersCount > 0
                ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} activo${activeFiltersCount > 1 ? "s" : ""}`
                : "Sin filtros"
            }
          />
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
            alignItems: "center",
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 7" } }}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Clave, nombre, dirección o teléfono"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
            <Box sx={filterToggleBoxSx()}>
              <FormControlLabel
                control={
                  <Switch
                    checked={soloActivas}
                    onChange={(_, checked) => setSoloActivas(checked)}
                  />
                }
                label="Solo activas"
                sx={{ m: 0 }}
              />
            </Box>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <Button
              variant="outlined"
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
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Catálogo de sucursales"
        subtitle="Revisión general de sedes, estado y personal activo asignado."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={`${paginatedRows.length} visibles de ${rows.length}`}
          />
        }
      >
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="info">
              No hay sucursales para los filtros actuales.
            </Alert>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 130 }}>Clave</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>Sucursal</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>Dirección</TableCell>
                    <TableCell sx={{ width: 170 }}>Teléfono</TableCell>
                    <TableCell sx={{ width: 130 }}>Estado</TableCell>
                    <TableCell sx={{ width: 150 }}>Empleados activos</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row) => (
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
                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700}>{row.nombre}</Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<BusinessRoundedIcon />}
                            label={`ID ${row.id}`}
                            sx={{
                              width: "fit-content",
                              fontWeight: 800,
                              bgcolor: alpha("#1d4ed8", 0.05),
                              color: "#1d4ed8",
                              borderColor: alpha("#1d4ed8", 0.18),
                            }}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <LocationOnRoundedIcon
                            fontSize="small"
                            sx={{ color: "text.secondary", mt: 0.15 }}
                          />
                          <Typography variant="body2" color="text.primary">
                            {row.direccion ?? "-"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PhoneRoundedIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            {row.telefono ?? "-"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={row.activo ? "Activa" : "Inactiva"}
                          sx={sucursalStatusChipSx(row.activo)}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight={700}>
                          {row.empleadosActivos}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.75}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(row)}
                              sx={actionIconButtonSx("edit")}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Desactivar">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => setConfirmTarget(row)}
                                disabled={!row.activo || deleteMutation.isPending}
                                sx={actionIconButtonSx("delete")}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deleteMutation.mutate(confirmTarget.id);
          }
        }}
        loading={deleteMutation.isPending}
        title="Desactivar sucursal"
        message={
          confirmTarget
            ? `Se desactivará la sucursal "${confirmTarget.nombre}".`
            : ""
        }
        confirmText="Desactivar"
        confirmColor="warning"
      />
    </AppPage>
  );
}