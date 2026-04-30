import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
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
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  conciliarVacacionesLegacyExcel,
  getAccionImportacionVacacionesLabel,
  getEstadoConciliacionLabel,
  type VacacionesLegacyConciliacion,
  type VacacionesLegacyConciliacionItem,
} from "../api/vacacionesImportaciones.api";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("es-MX").format(value);
}

function formatDays(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value);
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
      fontSize: "0.74rem",
      lineHeight: 1,
    },
    color: map.color,
    borderColor: map.border,
    backgroundColor: map.bg,
  } as const;
}

function estadoChipSx(value?: string | null) {
  switch (value) {
    case "ENCONTRADO":
      return softChipSx("success");
    case "POSIBLE_COINCIDENCIA":
      return softChipSx("warning");
    case "NO_ENCONTRADO":
      return softChipSx("error");
    default:
      return softChipSx("neutral");
  }
}

function diferenciaChipSx(value?: number | null) {
  if (value === null || value === undefined) {
    return softChipSx("neutral");
  }

  if (value === 0) {
    return softChipSx("success");
  }

  return softChipSx("warning");
}

function normalizeSearch(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function itemMatchesSearch(
  item: VacacionesLegacyConciliacionItem,
  search: string
) {
  const needle = normalizeSearch(search);

  if (!needle) {
    return true;
  }

  const haystack = normalizeSearch(
    [
      item.estado,
      item.hoja,
      item.numEmpleadoExcel,
      item.nombreExcel,
      item.rfcExcel,
      item.nssExcel,
      item.numEmpleadoSistema,
      item.nombreSistema,
      item.rfcSistema,
      item.nssSistema,
      item.estatusLaboralSistema,
      item.error,
      item.accionSugerida,
      ...(item.diferencias ?? []),
      ...(item.posiblesCoincidencias ?? []).flatMap((candidate) => [
        candidate.numEmpleado,
        candidate.nombre,
        candidate.rfc,
        candidate.nss,
        candidate.estatusLaboral,
        ...(candidate.motivos ?? []),
      ]),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return haystack.includes(needle);
}

const tableCellTruncateSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
} as const;

export default function VacacionesConciliacionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showSnackbar } = useAppSnackbar();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] =
    useState<VacacionesLegacyConciliacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const items = resultado?.items ?? [];

  const filteredItems = useMemo(() => {
    return items.filter((item) => itemMatchesSearch(item, busqueda));
  }, [items, busqueda]);

  const saldoExcelTotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.saldoExcel ?? 0), 0);
  }, [items]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setArchivo(selectedFile);
    setResultado(null);
    setBusqueda("");

    if (selectedFile) {
      showSnackbar(`Archivo seleccionado: ${selectedFile.name}`, "info");
    }
  };

  const handleClearFile = () => {
    setArchivo(null);
    setResultado(null);
    setBusqueda("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConciliar = async () => {
    if (!archivo) {
      showSnackbar("Selecciona un archivo Excel primero.", "warning");
      return;
    }

    try {
      setLoading(true);

      const data = await conciliarVacacionesLegacyExcel(archivo);
      setResultado(data);

      showSnackbar(
        `Conciliación lista: ${data.encontrados} encontrados, ${data.noEncontrados} no encontrados, ${data.posiblesCoincidencias} posibles coincidencias.`,
        data.noEncontrados > 0 || data.posiblesCoincidencias > 0
          ? "warning"
          : "success"
      );
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo ejecutar la conciliación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPage
      eyebrow="Vacaciones"
      title="Conciliación de empleados"
      subtitle="Cruce del Excel legacy contra empleados registrados en GV RH."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={
              loading ? (
                <CircularProgress size={18} />
              ) : (
                <ManageSearchRoundedIcon />
              )
            }
            onClick={handleConciliar}
            disabled={!archivo || loading}
          >
            {loading ? "Analizando..." : "Analizar conciliación"}
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Vacaciones / Conciliación"
        title="Antes de importar, primero empatamos"
        subtitle="Sube el Excel de nóminas y revisa qué empleados existen, cuáles faltan y qué candidatos podrían coincidir por número, RFC, NSS o nombre. Aquí se evita importar saldo al empleado equivocado."
        badge="Control RH"
        icon={<FactCheckRoundedIcon />}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="Sin cambios en BD"
              size="small"
              variant="outlined"
              icon={<CheckCircleRoundedIcon />}
              sx={{
                color: "#ffffff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />

            <Chip
              label="Revisión previa"
              size="small"
              variant="outlined"
              icon={<ManageSearchRoundedIcon />}
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
              Lectura ejecutiva
            </Typography>

            <Stack direction="row" spacing={2.25}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {formatNumber(resultado?.encontrados ?? 0)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  encontrados
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {formatNumber(resultado?.noEncontrados ?? 0)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  faltantes
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {formatNumber(resultado?.posiblesCoincidencias ?? 0)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  posibles
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Esta pantalla no importa saldos; solo revisa coincidencias.
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
            title="Filas preview"
            value={resultado?.totalItemsPreview ?? 0}
            subtitle="Registros detectados"
            icon={<TableViewRoundedIcon fontSize="small" />}
            badge="Excel"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Encontrados"
            value={resultado?.encontrados ?? 0}
            subtitle="Con empleado ligado"
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            badge="OK"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="No encontrados"
            value={resultado?.noEncontrados ?? 0}
            subtitle="Requieren revisión"
            icon={<ErrorOutlineRoundedIcon fontSize="small" />}
            badge="Revisar"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Posibles"
            value={resultado?.posiblesCoincidencias ?? 0}
            subtitle="Candidatos sugeridos"
            icon={<HelpOutlineRoundedIcon fontSize="small" />}
            badge="Cruce"
          />
        </Box>
      </Box>

      <SectionCard
        title="Archivo Excel"
        subtitle="Carga el archivo legacy para comparar empleados del Excel contra GV RH."
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
                startIcon={<CloudUploadRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
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
                      disabled={loading}
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
                  Selecciona el Excel antes de analizar la conciliación.
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ManageSearchRoundedIcon />
                  )
                }
                disabled={!archivo || loading}
                onClick={handleConciliar}
              >
                {loading ? "Analizando..." : "Analizar conciliación"}
              </Button>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            <Alert severity="info">
              Esta conciliación no modifica datos. Solo detecta empleados
              encontrados, no encontrados y posibles coincidencias.
            </Alert>

            <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
              Los empleados no encontrados deben revisarse antes de importar
              saldos reales. Primero orden, después pólvora.
            </Alert>

            {resultado?.advertencias?.map((warning, index) => (
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

      {resultado ? (
        <SectionCard
          title="Resultado de conciliación"
          subtitle="Revisa empleados encontrados, diferencias y candidatos probables."
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                label={`${formatNumber(filteredItems.length)} visibles`}
                sx={softChipSx("info")}
              />

              <Chip
                size="small"
                variant="outlined"
                label={`${formatDays(saldoExcelTotal)} días Excel`}
                sx={softChipSx("neutral")}
              />
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Buscar"
              size="small"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, número, RFC, NSS, estado, diferencia..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TableContainer
              sx={{
                border: `1px solid ${alpha("#0f172a", 0.06)}`,
                borderRadius: 3,
                overflowX: "auto",
                maxHeight: 660,
              }}
            >
              <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
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
                    <TableCell sx={{ minWidth: 160 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>Empleado Excel</TableCell>
                    <TableCell sx={{ minWidth: 290 }}>Empleado GV RH</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Saldo Excel
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Saldo sistema
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Diferencia
                    </TableCell>
                    <TableCell sx={{ minWidth: 280 }}>Diferencias</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>
                      Posibles coincidencias
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={`${item.hoja}-${item.filaReferencia ?? "x"}-${
                        item.empleadoId ?? item.nombreExcel ?? "sin-empleado"
                      }`}
                      hover
                      sx={{
                        backgroundColor:
                          item.estado === "ENCONTRADO"
                            ? "transparent"
                            : alpha("#0f172a", 0.018),
                      }}
                    >
                      <TableCell>
                        <Stack spacing={0.6}>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={getEstadoConciliacionLabel(item.estado)}
                            sx={estadoChipSx(item.estado)}
                          />

                          <Typography variant="caption" color="text.secondary">
                            Hoja: {item.hoja}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                          <Tooltip title={item.nombreExcel || item.hoja} arrow>
                            <Typography
                              fontWeight={800}
                              sx={{ ...tableCellTruncateSx, maxWidth: 240 }}
                            >
                              {item.nombreExcel || item.hoja}
                            </Typography>
                          </Tooltip>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ...tableCellTruncateSx, maxWidth: 240 }}
                          >
                            Nómina: {item.numEmpleadoExcel || "—"} · RFC:{" "}
                            {item.rfcExcel || "—"} · NSS: {item.nssExcel || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                          <Tooltip
                            title={
                              item.nombreSistema || item.error || "No encontrado"
                            }
                            arrow
                          >
                            <Typography
                              fontWeight={800}
                              sx={{ ...tableCellTruncateSx, maxWidth: 270 }}
                            >
                              {item.nombreSistema || "No encontrado"}
                            </Typography>
                          </Tooltip>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ...tableCellTruncateSx, maxWidth: 270 }}
                          >
                            ID: {item.empleadoId ?? "—"} · Nómina:{" "}
                            {item.numEmpleadoSistema || "—"} · Estatus:{" "}
                            {item.estatusLaboralSistema || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          variant="outlined"
                          label={formatDays(item.saldoExcel)}
                          sx={softChipSx("neutral")}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          variant="outlined"
                          label={formatDays(item.saldoSistemaActual)}
                          sx={softChipSx("neutral")}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          variant="outlined"
                          label={formatDays(item.diferenciaSaldo)}
                          sx={diferenciaChipSx(item.diferenciaSaldo)}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.6}>
                          {item.diferencias?.length ? (
                            item.diferencias.slice(0, 3).map((diff, index) => (
                              <Typography
                                key={`${item.hoja}-diff-${index}`}
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  lineHeight: 1.35,
                                }}
                              >
                                • {diff}
                              </Typography>
                            ))
                          ) : (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={getAccionImportacionVacacionesLabel(
                                item.accionSugerida
                              )}
                              sx={softChipSx(
                                item.estado === "ENCONTRADO"
                                  ? "success"
                                  : "neutral"
                              )}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.75}>
                          {item.posiblesCoincidencias?.length ? (
                            item.posiblesCoincidencias
                              .slice(0, 3)
                              .map((candidate) => (
                                <Box
                                  key={`${item.hoja}-candidate-${candidate.empleadoId}`}
                                  sx={{
                                    border: `1px solid ${alpha(
                                      "#0f172a",
                                      0.08
                                    )}`,
                                    borderRadius: 2,
                                    p: 1,
                                    backgroundColor: alpha("#1d4ed8", 0.025),
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={800}
                                      sx={{
                                        maxWidth: 190,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {candidate.nombre}
                                    </Typography>

                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={`${candidate.puntaje}%`}
                                      sx={softChipSx("info")}
                                    />
                                  </Stack>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Nómina: {candidate.numEmpleado} · RFC:{" "}
                                    {candidate.rfc || "—"} · NSS:{" "}
                                    {candidate.nss || "—"}
                                  </Typography>

                                  {candidate.motivos?.length ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", mt: 0.4 }}
                                    >
                                      {candidate.motivos.join(" · ")}
                                    </Typography>
                                  ) : null}
                                </Box>
                              ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <BadgeRoundedIcon
                            sx={{
                              fontSize: 42,
                              color: "text.disabled",
                              mb: 1,
                            }}
                          />
                          <Typography fontWeight={800}>
                            Sin resultados para la búsqueda
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Ajusta el texto de búsqueda o limpia el filtro.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </SectionCard>
      ) : (
        <SectionCard
          title="Sin conciliación ejecutada"
          subtitle="Carga un archivo y presiona Analizar conciliación para ver los resultados."
        >
          <Box sx={{ py: 4, textAlign: "center" }}>
            <AnalyticsRoundedIcon
              sx={{ fontSize: 46, color: "text.disabled", mb: 1 }}
            />
            <Typography fontWeight={800}>Listo para analizar</Typography>
            <Typography variant="body2" color="text.secondary">
              Esta pantalla solo revisa coincidencias; todavía no importa
              saldos.
            </Typography>
          </Box>
        </SectionCard>
      )}
    </AppPage>
  );
}
