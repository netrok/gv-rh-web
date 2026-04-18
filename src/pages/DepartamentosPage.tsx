import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
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
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createDepartamento,
  downloadBlobFile,
  exportDepartamentosPdf,
  exportDepartamentosXlsx,
  getDepartamentos,
  getFileNameFromDisposition,
  updateDepartamento,
  type Departamento,
  type SaveDepartamentoInput,
} from "../api/departamentos.api";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import { useAuth } from "../features/auth/AuthContext";

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

function getErrorMessage(error: unknown): string {
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

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role: string) => String(role).trim().toUpperCase());
}

function departamentoStatusChipSx(activo: boolean) {
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

function departamentoChipSx() {
  return {
    bgcolor: alpha("#1d4ed8", 0.05),
    color: "#1d4ed8",
    borderColor: alpha("#1d4ed8", 0.18),
    fontWeight: 800,
  };
}

function actionIconButtonSx(kind: "edit" | "toggle-active" | "toggle-inactive") {
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

  if (kind === "toggle-active") {
    return {
      width: 36,
      height: 36,
      borderRadius: "12px",
      border: `1px solid ${alpha("#d97706", 0.18)}`,
      backgroundColor: alpha("#d97706", 0.06),
      color: "#b45309",
      "&:hover": {
        backgroundColor: alpha("#d97706", 0.10),
        borderColor: alpha("#d97706", 0.28),
      },
    };
  }

  return {
    width: 36,
    height: 36,
    borderRadius: "12px",
    border: `1px solid ${alpha("#15803d", 0.18)}`,
    backgroundColor: alpha("#15803d", 0.06),
    color: "#15803d",
    "&:hover": {
      backgroundColor: alpha("#15803d", 0.10),
      borderColor: alpha("#15803d", 0.28),
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
  }, [initialValues, open, reset]);

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
  const { roles } = useAuth();

  const [search, setSearch] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Departamento | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "pdf" | null>(
    null
  );

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

  const departamentosQuery = useQuery<Departamento[]>({
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
    onError: (error: unknown) => {
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
    onSuccess: async (_, row: Departamento) => {
      await queryClient.invalidateQueries({ queryKey: ["departamentos"] });

      showSnackbar(
        row.activo ? "Departamento desactivado." : "Departamento reactivado.",
        "success"
      );

      setConfirmTarget(null);
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), "error");
      setConfirmTarget(null);
    },
  });

  const rows: Departamento[] = departamentosQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((x: Departamento) => {
      const matchesSearch = !term
        ? true
        : x.clave.toLowerCase().includes(term) ||
          x.nombre.toLowerCase().includes(term) ||
          (x.activo ? "activo" : "inactivo").includes(term);

      const matchesStatus = soloActivos ? x.activo : true;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, soloActivos]);

  const reportFilters = useMemo(
    () => ({
      q: search.trim() || undefined,
      activo: soloActivos ? true : undefined,
    }),
    [search, soloActivos]
  );

  useEffect(() => {
    setPage(0);
  }, [search, soloActivos, filteredRows.length]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const activeCount = useMemo(
    () => rows.filter((row: Departamento) => row.activo).length,
    [rows]
  );

  const inactiveCount = useMemo(
    () => rows.filter((row: Departamento) => !row.activo).length,
    [rows]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (soloActivos) count += 1;
    return count;
  }, [search, soloActivos]);

  const openCreateDialog = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((row: Departamento) => {
    setEditing(row);
    setDialogOpen(true);
  }, []);

  const handleExport = useCallback(
    async (format: "xlsx" | "pdf") => {
      try {
        setExportingFormat(format);

        const response =
          format === "xlsx"
            ? await exportDepartamentosXlsx(reportFilters)
            : await exportDepartamentosPdf(reportFilters);

        const fallback =
          format === "xlsx" ? "departamentos.xlsx" : "departamentos.pdf";

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
    },
    [reportFilters, showSnackbar]
  );

  const loadingAny =
    departamentosQuery.isLoading ||
    saveMutation.isPending ||
    toggleMutation.isPending;

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Departamentos"
      subtitle="Catálogo organizacional de áreas y estructuras internas de RH."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              void departamentosQuery.refetch();
            }}
          >
            Actualizar
          </Button>

          <Button
            variant="outlined"
            startIcon={<GridOnRoundedIcon />}
            onClick={() => void handleExport("xlsx")}
            disabled={loadingAny || exportingFormat !== null}
            sx={exportButtonSx("xlsx")}
          >
            {exportingFormat === "xlsx" ? "Exportando..." : "Excel"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={() => void handleExport("pdf")}
            disabled={loadingAny || exportingFormat !== null}
            sx={exportButtonSx("pdf")}
          >
            {exportingFormat === "pdf" ? "Exportando..." : "PDF"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Nuevo departamento
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de departamentos"
        subtitle="Administra las áreas organizacionales del sistema, su disponibilidad operativa y la base estructural para puestos y empleados."
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role: string) => (
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
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Base organizacional lista para estructurar puestos y empleados.
            </Typography>
          </Stack>
        }
      />

      {departamentosQuery.isError && (
        <Alert severity="error">
          No se pudo cargar el catálogo. {getErrorMessage(departamentosQuery.error)}
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

      <SectionCard
        title="Filtros"
        subtitle="Busca por clave, nombre o estado del departamento."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={
              activeFiltersCount > 0
                ? `${activeFiltersCount} filtro${
                    activeFiltersCount > 1 ? "s" : ""
                  } activo${activeFiltersCount > 1 ? "s" : ""}`
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
              label="Buscar"
              placeholder="Clave, nombre o estado"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
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
                    checked={soloActivos}
                    onChange={(_, checked) => setSoloActivos(checked)}
                  />
                }
                label="Solo activos"
                sx={{ m: 0 }}
              />
            </Box>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setSearch("");
                setSoloActivos(false);
              }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Limpiar filtros
            </Button>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Listado"
        subtitle="Consulta general del catálogo de departamentos."
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
        ) : filteredRows.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="info">
              {search.trim() || soloActivos
                ? "No encontramos departamentos con los filtros actuales."
                : "No hay departamentos capturados todavía."}
            </Alert>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 560 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 80 }}>ID</TableCell>
                    <TableCell sx={{ width: 160 }}>Clave</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>Nombre</TableCell>
                    <TableCell sx={{ width: 140 }}>Estatus</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row: Departamento) => (
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

                      <TableCell>
                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                          <Typography
                            fontWeight={700}
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.nombre}
                          </Typography>

                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<ApartmentOutlinedIcon />}
                            label={row.clave}
                            sx={departamentoChipSx()}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={row.activo ? "Activo" : "Inactivo"}
                          sx={departamentoStatusChipSx(row.activo)}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(row)}
                              sx={actionIconButtonSx("edit")}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={row.activo ? "Desactivar" : "Reactivar"}>
                            <IconButton
                              size="small"
                              onClick={() => setConfirmTarget(row)}
                              sx={actionIconButtonSx(
                                row.activo ? "toggle-active" : "toggle-inactive"
                              )}
                            >
                              {row.activo ? (
                                <BlockRoundedIcon fontSize="small" />
                              ) : (
                                <CheckCircleRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
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
    </AppPage>
  );
}