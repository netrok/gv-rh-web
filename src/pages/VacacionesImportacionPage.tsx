import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  confirmarVacacionesLegacyExcel,
  getAccionImportacionVacacionesLabel,
  previewVacacionesLegacyExcel,
  type VacacionesLegacyImportConfirmResult,
  type VacacionesLegacyImportPreview,
  type VacacionesLegacyImportPreviewItem,
} from "../api/vacacionesImportaciones.api";
import AppPage from "../components/ui/AppPage";
import EmptyState from "../components/ui/EmptyState";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

function formatDays(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("es-MX").format(value);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeAxios = error as {
      response?: {
        status?: number;
        statusText?: string;
        data?: {
          message?: string;
          title?: string;
          error?: string;
        };
      };
      message?: string;
    };

    const apiMessage =
      maybeAxios.response?.data?.message ||
      maybeAxios.response?.data?.title ||
      maybeAxios.response?.data?.error;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    const statusText = `${maybeAxios.response?.status ?? ""} ${
      maybeAxios.response?.statusText ?? maybeAxios.message ?? ""
    }`.trim();

    if (statusText) {
      return statusText;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function getSaldoChipSx(value?: number | null) {
  if (value === null || value === undefined) {
    return {
      color: "#475569",
      borderColor: alpha("#475569", 0.18),
      backgroundColor: alpha("#475569", 0.05),
    } as const;
  }

  if (value < 0) {
    return {
      color: "#b91c1c",
      borderColor: alpha("#dc2626", 0.22),
      backgroundColor: alpha("#dc2626", 0.05),
    } as const;
  }

  if (value > 0) {
    return {
      color: "#166534",
      borderColor: alpha("#16a34a", 0.22),
      backgroundColor: alpha("#16a34a", 0.05),
    } as const;
  }

  return {
    color: "#475569",
    borderColor: alpha("#475569", 0.18),
    backgroundColor: alpha("#475569", 0.05),
  } as const;
}

function getDiferenciaChipSx(value?: number | null) {
  if (value === null || value === undefined) {
    return getSaldoChipSx(value);
  }

  if (value === 0) {
    return {
      color: "#166534",
      borderColor: alpha("#16a34a", 0.22),
      backgroundColor: alpha("#16a34a", 0.05),
    } as const;
  }

  return {
    color: "#b45309",
    borderColor: alpha("#b45309", 0.22),
    backgroundColor: alpha("#b45309", 0.05),
  } as const;
}

function softChipSx(
  variant: "success" | "warning" | "error" | "info" | "neutral"
) {
  const map = {
    success: {
      color: "#166534",
      border: alpha("#16a34a", 0.22),
      bg: alpha("#16a34a", 0.05),
    },
    warning: {
      color: "#b45309",
      border: alpha("#b45309", 0.22),
      bg: alpha("#b45309", 0.05),
    },
    error: {
      color: "#b91c1c",
      border: alpha("#dc2626", 0.22),
      bg: alpha("#dc2626", 0.05),
    },
    info: {
      color: "#1d4ed8",
      border: alpha("#1d4ed8", 0.18),
      bg: alpha("#1d4ed8", 0.05),
    },
    neutral: {
      color: "#475569",
      border: alpha("#475569", 0.18),
      bg: alpha("#475569", 0.05),
    },
  }[variant];

  return {
    fontWeight: 800,
    borderRadius: "999px",
    height: 24,
    width: "fit-content",
    maxWidth: "100%",
    "& .MuiChip-label": {
      px: 1.1,
      fontSize: "0.76rem",
      lineHeight: 1,
    },
    color: map.color,
    borderColor: map.border,
    backgroundColor: map.bg,
  } as const;
}

function accionChipSx(value?: string | null) {
  switch (value) {
    case "IMPORTAR_SALDO_INICIAL":
    case "IMPORTADO_SALDO_INICIAL":
    case "SIN_CAMBIOS":
      return softChipSx("success");

    case "REVISAR_DIFERENCIA_CON_SISTEMA":
    case "REVISION_MANUAL":
    case "OMITIDO":
      return softChipSx("warning");

    case "EMPLEADO_NO_ENCONTRADO":
    case "ERROR":
      return softChipSx("error");

    default:
      return softChipSx("neutral");
  }
}

function resultChipSx(importado: boolean, error?: string | null) {
  if (importado) {
    return softChipSx("success");
  }

  if (error) {
    return softChipSx("error");
  }

  return softChipSx("warning");
}

function canImportItem(item: VacacionesLegacyImportPreviewItem) {
  return item.puedeImportar && Boolean(item.empleadoId);
}

const tableCellTruncateSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
} as const;

export default function VacacionesImportacionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showSnackbar } = useAppSnackbar();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] =
    useState<VacacionesLegacyImportPreview | null>(null);
  const [resultado, setResultado] =
    useState<VacacionesLegacyImportConfirmResult | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const [selectedEmpleadoIds, setSelectedEmpleadoIds] = useState<number[]>([]);
  const [comentario, setComentario] = useState(
    "Importación inicial revisada por RH/Nóminas"
  );
  const [importarTodosElegibles, setImportarTodosElegibles] = useState(false);
  const [permitirSaldosNegativos, setPermitirSaldosNegativos] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = preview?.items ?? [];

  const importables = useMemo(
    () => items.filter((item) => canImportItem(item)),
    [items]
  );

  const selectedSet = useMemo(
    () => new Set(selectedEmpleadoIds),
    [selectedEmpleadoIds]
  );

  const selectedImportablesCount = selectedEmpleadoIds.length;

  const saldoTotalImportable = useMemo(() => {
    return importables.reduce((total, item) => total + (item.saldoExcel ?? 0), 0);
  }, [importables]);

  const selectedSaldoTotal = useMemo(() => {
    return items
      .filter((item) => item.empleadoId && selectedSet.has(item.empleadoId))
      .reduce((total, item) => total + (item.saldoExcel ?? 0), 0);
  }, [items, selectedSet]);

  const noEncontrados = preview?.empleadosNoEncontrados ?? 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setArchivo(selectedFile);
    setPreview(null);
    setResultado(null);
    setSelectedEmpleadoIds([]);
    setImportarTodosElegibles(false);

    if (selectedFile) {
      showSnackbar(`Archivo seleccionado: ${selectedFile.name}`, "info");
    }
  };

  const handleClearFile = () => {
    setArchivo(null);
    setPreview(null);
    setResultado(null);
    setSelectedEmpleadoIds([]);
    setImportarTodosElegibles(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePreview = async () => {
    if (!archivo) {
      showSnackbar("Selecciona un archivo Excel primero.", "warning");
      return;
    }

    try {
      setLoadingPreview(true);
      setResultado(null);

      const data = await previewVacacionesLegacyExcel(archivo);

      setPreview(data);

      const ids = data.items
        .filter((item) => canImportItem(item))
        .map((item) => item.empleadoId!)
        .filter((id, index, array) => array.indexOf(id) === index);

      setSelectedEmpleadoIds(ids);

      showSnackbar(
        `Preview listo: ${data.empleadosDetectados} detectados, ${data.empleadosNoEncontrados} no encontrados.`,
        "success"
      );
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo procesar el preview del Excel.",
        "error"
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggleEmpleado = (empleadoId?: number | null) => {
    if (!empleadoId) {
      return;
    }

    setSelectedEmpleadoIds((current) => {
      if (current.includes(empleadoId)) {
        return current.filter((id) => id !== empleadoId);
      }

      return [...current, empleadoId];
    });
  };

  const handleSelectAllImportables = () => {
    const ids = importables
      .map((item) => item.empleadoId!)
      .filter((id, index, array) => array.indexOf(id) === index);

    setSelectedEmpleadoIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedEmpleadoIds([]);
  };

  const handleOpenConfirm = () => {
    if (!archivo) {
      showSnackbar("Selecciona un archivo Excel primero.", "warning");
      return;
    }

    if (!preview) {
      showSnackbar("Primero ejecuta el preview.", "warning");
      return;
    }

    if (!importarTodosElegibles && selectedEmpleadoIds.length === 0) {
      showSnackbar("Selecciona al menos un empleado para importar.", "warning");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!archivo) {
      showSnackbar("Selecciona un archivo Excel primero.", "warning");
      return;
    }

    try {
      setLoadingConfirm(true);

      const data = await confirmarVacacionesLegacyExcel({
        archivo,
        empleadoIds: selectedEmpleadoIds,
        importarTodosElegibles,
        permitirSaldosNegativos,
        comentario,
      });

      setResultado(data);
      setConfirmOpen(false);

      showSnackbar(
        `Importación terminada: ${data.importados} importados, ${data.omitidos} omitidos, ${data.errores} errores.`,
        data.errores > 0 ? "warning" : "success"
      );
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo confirmar la importación.",
        "error"
      );
    } finally {
      setLoadingConfirm(false);
    }
  };

  const busy = loadingPreview || loadingConfirm;

  return (
    <AppPage
      eyebrow="Vacaciones"
      title="Importar saldos"
      subtitle="Carga controlada de saldos iniciales desde Excel de nóminas."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={busy ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
            onClick={handlePreview}
            disabled={!archivo || busy}
          >
            {loadingPreview ? "Analizando..." : "Actualizar preview"}
          </Button>

          <Button
            variant="contained"
            startIcon={
              loadingConfirm ? <CircularProgress size={18} /> : <DoneAllRoundedIcon />
            }
            onClick={handleOpenConfirm}
            disabled={!preview || importables.length === 0 || busy}
          >
            Confirmar saldos
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Vacaciones / Importación Excel"
        title="Saldos iniciales bajo control"
        subtitle="Sube el archivo oficial de nóminas, revisa coincidencias y confirma únicamente los empleados válidos. El saldo pendiente se registra como SALDO_INICIAL con trazabilidad del Excel."
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="Preview obligatorio"
              size="small"
              variant="outlined"
              icon={<SearchRoundedIcon />}
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />

            <Chip
              label="Confirmación controlada"
              size="small"
              variant="outlined"
              icon={<DoneAllRoundedIcon />}
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />

            <Chip
              label=".xls / .xlsx"
              size="small"
              variant="outlined"
              icon={<TableViewRoundedIcon />}
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />
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
                  {formatNumber(importables.length)}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  elegibles
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {formatNumber(noEncontrados)}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  no encontrados
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {formatDays(importarTodosElegibles ? saldoTotalImportable : selectedSaldoTotal)}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  días a importar
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Primero revisa el preview. Después confirma solo lo que RH/Nóminas valide.
            </Typography>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(12, 1fr)",
          },
        }}
      >
        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Hojas"
            value={preview?.totalHojas ?? 0}
            subtitle="Total en el archivo"
            icon={<TableViewRoundedIcon fontSize="small" />}
            badge="Excel"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Analizadas"
            value={preview?.hojasAnalizadas ?? 0}
            subtitle="Con datos útiles"
            icon={<FactCheckRoundedIcon fontSize="small" />}
            badge="Preview"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Detectados"
            value={preview?.empleadosDetectados ?? 0}
            subtitle="Empatados con sistema"
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            badge="OK"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="No encontrados"
            value={preview?.empleadosNoEncontrados ?? 0}
            subtitle="Requieren conciliación"
            icon={<ErrorOutlineRoundedIcon fontSize="small" />}
            badge="Revisar"
          />
        </Box>
      </Box>

      <SectionCard
        title="Archivo Excel"
        subtitle="Selecciona el archivo oficial y ejecuta el preview antes de importar."
        actions={
          archivo ? (
            <Chip
              size="small"
              variant="outlined"
              label={archivo.name}
              sx={softChipSx("info")}
            />
          ) : (
            <Chip
              size="small"
              variant="outlined"
              label="Sin archivo"
              sx={softChipSx("warning")}
            />
          )
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 380px) 1fr" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              border: `1px dashed ${alpha("#0f172a", 0.16)}`,
              borderRadius: 3,
              p: 2,
              backgroundColor: alpha("#0f172a", 0.02),
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "14px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha("#1d4ed8", 0.08),
                    color: "#1d4ed8",
                  }}
                >
                  <CloudUploadRoundedIcon />
                </Box>

                <Box>
                  <Typography fontWeight={800}>Carga de archivo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formatos permitidos: .xls y .xlsx
                  </Typography>
                </Box>
              </Stack>

              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
              />

              <Button
                variant="outlined"
                startIcon={<FileUploadRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                sx={{ justifyContent: "flex-start" }}
              >
                Seleccionar archivo
              </Button>

              {archivo ? (
                <Alert
                  severity="info"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={handleClearFile}
                      disabled={busy}
                    >
                      Quitar
                    </Button>
                  }
                >
                  <strong>{archivo.name}</strong>
                  <br />
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </Alert>
              ) : (
                <Alert severity="warning">
                  Selecciona el Excel nuevo/oficial antes de confirmar saldos.
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={
                  loadingPreview ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SearchRoundedIcon />
                  )
                }
                disabled={!archivo || busy}
                onClick={handlePreview}
              >
                {loadingPreview ? "Analizando..." : "Ejecutar preview"}
              </Button>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            <Alert severity="info">
              Esta pantalla importa el saldo pendiente del Excel como{" "}
              <strong>SALDO_INICIAL</strong>. El histórico completo del Excel se
              guarda como observación para auditoría.
            </Alert>

            <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
              No confirma empleados no encontrados ni empleados con periodos
              existentes. Si hay diferencias, primero debe revisarlo RH/Nóminas.
            </Alert>

            {preview?.advertencias?.map((warning, index) => (
              <Alert
                key={`${warning}-${index}`}
                severity="warning"
                icon={<WarningAmberRoundedIcon />}
              >
                {warning}
              </Alert>
            ))}
          </Stack>
        </Box>
      </SectionCard>

      {preview ? (
        <SectionCard
          title="Preview de importación"
          subtitle="Revisa coincidencias, saldos, diferencias y selecciona los empleados a importar."
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                label={`${formatNumber(importables.length)} elegibles`}
                sx={softChipSx("success")}
              />

              <Chip
                size="small"
                variant="outlined"
                label={`${formatNumber(selectedImportablesCount)} seleccionados`}
                sx={softChipSx(selectedImportablesCount > 0 ? "info" : "neutral")}
              />

              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAllImportables}
                disabled={importables.length === 0 || importarTodosElegibles || busy}
              >
                Seleccionar elegibles
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={handleClearSelection}
                disabled={
                  selectedEmpleadoIds.length === 0 || importarTodosElegibles || busy
                }
              >
                Limpiar
              </Button>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importarTodosElegibles}
                      onChange={(_, checked) => setImportarTodosElegibles(checked)}
                      disabled={busy || importables.length === 0}
                    />
                  }
                  label="Importar todos los elegibles"
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={permitirSaldosNegativos}
                      onChange={(_, checked) => setPermitirSaldosNegativos(checked)}
                      disabled={busy}
                    />
                  }
                  label="Permitir saldos negativos"
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
                <TextField
                  label="Buscar visualmente en tabla"
                  size="small"
                  disabled
                  fullWidth
                  value="Se mostrará todo el preview generado"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "span 1", md: "span 12" } }}>
                <TextField
                  label="Comentario de confirmación"
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={busy}
                />
              </Box>
            </Box>

            <TableContainer
              sx={{
                border: `1px solid ${alpha("#0f172a", 0.06)}`,
                borderRadius: 3,
                overflowX: "auto",
                maxHeight: 620,
              }}
            >
              <Table stickyHeader size="small" sx={{ minWidth: 1100 }}>
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      zIndex: 2,
                      fontWeight: 800,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell padding="checkbox">Sel.</TableCell>
                    <TableCell sx={{ minWidth: 230 }}>Empleado Excel</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>Empleado sistema</TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Saldo Excel
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Saldo sistema
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Diferencia
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Acción</TableCell>
                    <TableCell sx={{ width: 120 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => {
                    const canSelect = canImportItem(item);
                    const checked = Boolean(
                      item.empleadoId && selectedSet.has(item.empleadoId)
                    );

                    return (
                      <TableRow
                        key={`${item.hoja}-${item.empleadoId ?? "no-id"}-${
                          item.filaReferencia ?? "no-row"
                        }`}
                        hover
                        selected={checked}
                        sx={{
                          backgroundColor: item.puedeImportar
                            ? "transparent"
                            : alpha("#0f172a", 0.018),
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={checked}
                            disabled={!canSelect || importarTodosElegibles || busy}
                            onChange={() => handleToggleEmpleado(item.empleadoId)}
                          />
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                            <Tooltip title={item.nombreExcel || item.hoja} arrow>
                              <Typography
                                fontWeight={800}
                                sx={{ ...tableCellTruncateSx, maxWidth: 210 }}
                              >
                                {item.nombreExcel || item.hoja}
                              </Typography>
                            </Tooltip>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ...tableCellTruncateSx, maxWidth: 210 }}
                            >
                              Hoja: {item.hoja} · Nómina:{" "}
                              {item.numEmpleadoExcel || "—"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                            <Tooltip
                              title={item.nombreSistema || item.error || "No encontrado"}
                              arrow
                            >
                              <Typography
                                fontWeight={800}
                                sx={{ ...tableCellTruncateSx, maxWidth: 260 }}
                              >
                                {item.nombreSistema || "No encontrado"}
                              </Typography>
                            </Tooltip>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ...tableCellTruncateSx, maxWidth: 260 }}
                            >
                              ID: {item.empleadoId ?? "—"} · Nómina:{" "}
                              {item.numEmpleadoSistema || "—"} · RFC:{" "}
                              {item.rfcExcel || "—"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            variant="outlined"
                            label={formatDays(item.saldoExcel)}
                            sx={{
                              ...softChipSx("neutral"),
                              ...getSaldoChipSx(item.saldoExcel),
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          {formatDays(item.saldoSistemaActual)}
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            variant="outlined"
                            label={formatDays(item.diferencia)}
                            sx={{
                              ...softChipSx("neutral"),
                              ...getDiferenciaChipSx(item.diferencia),
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={getAccionImportacionVacacionesLabel(
                              item.accionSugerida
                            )}
                            sx={accionChipSx(item.accionSugerida)}
                          />
                        </TableCell>

                        <TableCell>
                          {item.puedeImportar ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label="Importable"
                              sx={softChipSx("success")}
                            />
                          ) : (
                            <Tooltip title={item.error || "No importable"} arrow>
                              <Chip
                                size="small"
                                variant="outlined"
                                label="Revisar"
                                sx={softChipSx("warning")}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          icon={<BalanceRoundedIcon sx={{ fontSize: 52 }} />}
                          title="No hay registros para mostrar"
                          description="Ejecuta el preview del archivo Excel para ver los saldos detectados."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={1.5}
            >
              <Typography variant="body2" color="text.secondary">
                {importarTodosElegibles
                  ? `Se importarán todos los elegibles: ${formatNumber(
                      importables.length
                    )}.`
                  : `Seleccionados: ${formatNumber(
                      selectedImportablesCount
                    )}. Días seleccionados: ${formatDays(selectedSaldoTotal)}.`}
              </Typography>

              <Button
                variant="contained"
                startIcon={
                  loadingConfirm ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <DoneAllRoundedIcon />
                  )
                }
                onClick={handleOpenConfirm}
                disabled={importables.length === 0 || busy}
              >
                Confirmar importación
              </Button>
            </Stack>
          </Stack>
        </SectionCard>
      ) : (
        <SectionCard
          title="Preview de importación"
          subtitle="Aquí aparecerá la revisión del Excel antes de confirmar."
        >
          <EmptyState
            icon={<UploadFileRoundedIcon sx={{ fontSize: 52 }} />}
            title="Ejecuta el preview para comenzar"
            description="El sistema leerá el Excel, detectará empleados, calculará diferencias y marcará qué registros pueden importarse."
            actionLabel="Seleccionar archivo"
            onAction={() => fileInputRef.current?.click()}
          />
        </SectionCard>
      )}

      {resultado && (
        <SectionCard
          title="Resultado de importación"
          subtitle="Resumen de empleados importados, omitidos y errores detectados."
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                label={`${resultado.importados} importados`}
                sx={softChipSx("success")}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${resultado.omitidos} omitidos`}
                sx={softChipSx("warning")}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${resultado.errores} errores`}
                sx={softChipSx(resultado.errores > 0 ? "error" : "neutral")}
              />
            </Stack>
          }
        >
          <Stack spacing={2}>
            {resultado.advertencias.map((warning, index) => (
              <Alert key={`${warning}-${index}`} severity="warning">
                {warning}
              </Alert>
            ))}

            <TableContainer
              sx={{
                border: `1px solid ${alpha("#0f172a", 0.06)}`,
                borderRadius: 3,
                overflowX: "auto",
              }}
            >
              <Table size="small" sx={{ minWidth: 880 }}>
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      fontWeight: 800,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell align="right">Saldo importado</TableCell>
                    <TableCell>Periodo</TableCell>
                    <TableCell>Movimiento</TableCell>
                    <TableCell>Resultado</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {resultado.items.map((item, index) => (
                    <TableRow key={`${item.hoja}-${item.empleadoId ?? index}`}>
                      <TableCell>
                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800}>
                            {item.nombreEmpleado || item.hoja}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {item.empleadoId ?? "—"} · Nómina:{" "}
                            {item.numEmpleado || "—"} · Hoja: {item.hoja}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        {formatDays(item.saldoImportado ?? item.saldoExcel)}
                      </TableCell>

                      <TableCell>{item.vacacionPeriodoId ?? "—"}</TableCell>
                      <TableCell>{item.vacacionMovimientoId ?? "—"}</TableCell>

                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              item.importado
                                ? "Importado"
                                : item.error
                                  ? "Error"
                                  : "Omitido"
                            }
                            sx={resultChipSx(item.importado, item.error)}
                          />

                          {(item.mensaje || item.error) && (
                            <Typography
                              variant="caption"
                              color={item.error ? "error" : "text.secondary"}
                            >
                              {item.error || item.mensaje}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </SectionCard>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (loadingConfirm) return;
          setConfirmOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirmar importación de saldos</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Esta acción creará periodos y movimientos{" "}
              <strong>SALDO_INICIAL</strong>. No reconstruye el histórico
              completo; importa el saldo vigente del Excel.
            </Alert>

            <Divider />

            <Typography variant="body2">
              Archivo: <strong>{archivo?.name || "—"}</strong>
            </Typography>

            <Typography variant="body2">
              Modo:{" "}
              <strong>
                {importarTodosElegibles
                  ? `Importar todos los elegibles (${importables.length})`
                  : `Importar seleccionados (${selectedEmpleadoIds.length})`}
              </strong>
            </Typography>

            <Typography variant="body2">
              Días a importar:{" "}
              <strong>
                {formatDays(
                  importarTodosElegibles ? saldoTotalImportable : selectedSaldoTotal
                )}
              </strong>
            </Typography>

            <Typography variant="body2">
              Saldos negativos:{" "}
              <strong>
                {permitirSaldosNegativos ? "Permitidos" : "Bloqueados"}
              </strong>
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={loadingConfirm}
            color="inherit"
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmImport}
            disabled={loadingConfirm}
            startIcon={
              loadingConfirm ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DoneAllRoundedIcon />
              )
            }
          >
            {loadingConfirm ? "Importando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
