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
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createPuesto,
  downloadBlobFile,
  exportPuestosPdf,
  exportPuestosXlsx,
  getFileNameFromDisposition,
  getPuestos,
  updatePuesto,
  type Puesto,
  type SavePuestoInput,
} from "../api/puestos.api";
import {
  getDepartamentos,
  type Departamento,
} from "../api/departamentos.api";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import { useAuth } from "../features/auth/AuthContext";

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

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role) => String(role).trim().toUpperCase());
}

function puestoStatusChipSx(activo: boolean) {
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

function departmentChipSx() {
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
  const { roles } = useAuth();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Puesto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Puesto | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "pdf" | null>(
    null
  );

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

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

  const reportFilters = useMemo(
    () => ({
      q: search.trim() || undefined,
      activo: soloActivos ? true : undefined,
      departamentoId: departamentoFilter ? Number(departamentoFilter) : undefined,
    }),
    [search, soloActivos, departamentoFilter]
  );

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (departamentoFilter) count += 1;
    if (soloActivos) count += 1;
    return count;
  }, [search, departamentoFilter, soloActivos]);

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
    puestosQuery.isLoading ||
    departamentosQuery.isLoading ||
    saveMutation.isPending ||
    toggleMutation.isPending;

  const handleRefresh = () => {
    void puestosQuery.refetch();
    void departamentosQuery.refetch();
  };

  const handleExport = async (format: "xlsx" | "pdf") => {
    try {
      setExportingFormat(format);

      const response =
        format === "xlsx"
          ? await exportPuestosXlsx(reportFilters)
          : await exportPuestosPdf(reportFilters);

      const fallback = format === "xlsx" ? "puestos.xlsx" : "puestos.pdf";

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
  };

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Puestos"
      subtitle="Catálogo de puestos vinculados a departamentos y estructura operativa."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loadingAny}
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
            disabled={!canOpenDialog}
          >
            Nuevo puesto
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de puestos"
        subtitle="Administra los puestos del sistema, su disponibilidad operativa y su relación con la estructura departamental."
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
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              {canOpenDialog
                ? "Hay departamentos disponibles para crear y asignar puestos."
                : "Falta al menos un departamento para poder registrar puestos."}
            </Typography>
          </Stack>
        }
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
          gap: { xs: 2, md: 2.25 },
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
          icon={<AccountTreeRoundedIcon fontSize="small" />}
          badge="RH"
        />
      </Box>

      <SectionCard
        title="Filtros"
        subtitle="Busca por clave, nombre, departamento o estado del puesto."
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
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 5" } }}>
            <TextField
              label="Buscar"
              placeholder="Clave, nombre, departamento o estatus"
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
            <TextField
              select
              label="Departamento"
              value={departamentoFilter}
              onChange={(e) => setDepartamentoFilter(e.target.value)}
              fullWidth
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
                setDepartamentoFilter("");
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
        subtitle="Consulta general del catálogo de puestos y su departamento asociado."
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
                    <TableCell sx={{ width: 70 }}>ID</TableCell>
                    <TableCell sx={{ width: 160 }}>Clave</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>Nombre</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>Departamento</TableCell>
                    <TableCell sx={{ width: 130 }}>Estatus</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Acciones
                    </TableCell>
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

                          <TableCell>
                            <Typography fontWeight={600}>{row.nombre}</Typography>
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
                              row.departamentoId
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={row.activo ? "Activo" : "Inactivo"}
                              sx={puestoStatusChipSx(row.activo)}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.75}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="Editar">
                                <IconButton
                                  onClick={() => openEditDialog(row)}
                                  sx={actionIconButtonSx("edit")}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title={row.activo ? "Desactivar" : "Reactivar"}>
                                <IconButton
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
    </AppPage>
  );
}