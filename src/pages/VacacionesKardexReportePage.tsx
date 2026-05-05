import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import ImportExportRoundedIcon from "@mui/icons-material/ImportExportRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

import { getDepartamentos } from "../api/departamentos.api";
import { getSucursales } from "../api/sucursales.api";
import {
  exportVacacionesKardexPdf,
  exportVacacionesKardexXlsx,
  getEstatusLaboralLabel,
  getTipoMovimientoVacacionLabel,
  getVacacionesKardexReporte,
  type VacacionesKardexReporteQuery,
  type VacacionesKardexReporteRow,
} from "../api/vacacionesReportes.api";

type SucursalListItem =
  Awaited<ReturnType<typeof getSucursales>> extends Array<infer T> ? T : never;

type DepartamentoListItem =
  Awaited<ReturnType<typeof getDepartamentos>> extends Array<infer T>
    ? T
    : never;

type SortDirection = "asc" | "desc";

type SortKey =
  | "fechaMovimiento"
  | "numEmpleado"
  | "nombreEmpleado"
  | "sucursal"
  | "departamento"
  | "estatusLaboral"
  | "anioServicio"
  | "tipoMovimiento"
  | "dias"
  | "saldoAntes"
  | "saldoDespues"
  | "origen"
  | "usuarioResponsable";

const TIPO_MOVIMIENTO_OPTIONS = [
  "SALDO_INICIAL",
  "APERTURA",
  "DISFRUTE",
  "PAGO_DIAS",
  "AJUSTE_POSITIVO",
  "AJUSTE_NEGATIVO",
  "CANCELACION",
  "VENCIMIENTO",
  "PAGO_PRIMA",
];

function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
}

function formatDays(value?: number | null): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function getMovementChipSx(value: number) {
  if (value < 0) {
    return {
      color: "#991b1b",
      borderColor: alpha("#dc2626", 0.22),
      backgroundColor: alpha("#dc2626", 0.05),
      fontWeight: 800,
      borderRadius: "999px",
      minWidth: 62,
    };
  }

  if (value > 0) {
    return {
      color: "#166534",
      borderColor: alpha("#16a34a", 0.22),
      backgroundColor: alpha("#16a34a", 0.05),
      fontWeight: 800,
      borderRadius: "999px",
      minWidth: 62,
    };
  }

  return {
    color: "#475569",
    borderColor: alpha("#475569", 0.18),
    backgroundColor: alpha("#475569", 0.04),
    fontWeight: 800,
    borderRadius: "999px",
    minWidth: 62,
  };
}

function getSortValue(item: VacacionesKardexReporteRow, key: SortKey) {
  switch (key) {
    case "fechaMovimiento":
      return item.fechaMovimiento ?? "";
    case "numEmpleado":
      return item.numEmpleado ?? "";
    case "nombreEmpleado":
      return item.nombreEmpleado ?? "";
    case "sucursal":
      return item.sucursal ?? "";
    case "departamento":
      return item.departamento ?? "";
    case "estatusLaboral":
      return getEstatusLaboralLabel(item.estatusLaboral);
    case "anioServicio":
      return item.anioServicio ?? 0;
    case "tipoMovimiento":
      return getTipoMovimientoVacacionLabel(item.tipoMovimiento);
    case "dias":
      return item.dias ?? 0;
    case "saldoAntes":
      return item.saldoAntes ?? 0;
    case "saldoDespues":
      return item.saldoDespues ?? 0;
    case "origen":
      return item.origen ?? "";
    case "usuarioResponsable":
      return item.usuarioResponsable ?? "";
    default:
      return "";
  }
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a ?? "").localeCompare(String(b ?? ""), "es-MX", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortRows(
  rows: VacacionesKardexReporteRow[],
  orderBy: SortKey,
  order: SortDirection
) {
  return [...rows].sort((a, b) => {
    const result = compareValues(getSortValue(a, orderBy), getSortValue(b, orderBy));
    return order === "asc" ? result : -result;
  });
}

function SortableHeaderCell({
  label,
  sortKey,
  orderBy,
  order,
  align = "left",
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  orderBy: SortKey;
  order: SortDirection;
  align?: "left" | "right" | "center";
  onSort: (key: SortKey) => void;
}) {
  const active = orderBy === sortKey;

  return (
    <TableCell align={align}>
      <TableSortLabel
        active={active}
        direction={active ? order : "asc"}
        onClick={() => onSort(sortKey)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

function VacacionesKardexRow({ item }: { item: VacacionesKardexReporteRow }) {
  const hasDetail =
    Boolean(item.comentario?.trim()) ||
    Boolean(item.referencia?.trim()) ||
    Boolean(item.importacionArchivo?.trim());

  return (
    <>
      <TableRow
        hover
        sx={{
          "& .MuiTableCell-root": {
            verticalAlign: "top",
            py: 1.05,
          },
        }}
      >
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {formatDate(item.fechaMovimiento)}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Typography fontWeight={800}>{item.numEmpleado}</Typography>
        </TableCell>

        <TableCell sx={{ minWidth: 220 }}>
          <Stack spacing={0.35}>
            <Typography fontWeight={800}>{item.nombreEmpleado}</Typography>
            <Typography variant="caption" color="text.secondary">
              {item.puesto || "Sin puesto"}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell sx={{ minWidth: 135 }}>
          {item.sucursal || "Sin sucursal"}
        </TableCell>

        <TableCell sx={{ minWidth: 140 }}>
          {item.departamento || "Sin departamento"}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip
            size="small"
            variant="outlined"
            label={getEstatusLaboralLabel(item.estatusLaboral)}
            color={item.activo ? "success" : "warning"}
          />
        </TableCell>

        <TableCell align="center">
          <Chip size="small" variant="outlined" label={item.anioServicio} />
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip
            size="small"
            variant="outlined"
            label={getTipoMovimientoVacacionLabel(item.tipoMovimiento)}
          />
        </TableCell>

        <TableCell align="right">
          <Chip
            size="small"
            variant="outlined"
            label={formatDays(item.dias)}
            sx={getMovementChipSx(item.dias)}
          />
        </TableCell>

        <TableCell align="right">{formatDays(item.saldoAntes)}</TableCell>
        <TableCell align="right">{formatDays(item.saldoDespues)}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{item.origen || "—"}</TableCell>

        <TableCell sx={{ minWidth: 190, maxWidth: 240 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.35,
              wordBreak: "break-word",
            }}
          >
            {item.usuarioResponsable || "—"}
          </Typography>
        </TableCell>
      </TableRow>

      {hasDetail ? (
        <TableRow
          sx={{
            "& .MuiTableCell-root": {
              borderTop: 0,
              py: 1.15,
            },
          }}
        >
          <TableCell colSpan={14} sx={{ backgroundColor: "#f8fafc" }}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.5,
                py: 1.15,
                backgroundColor: "#ffffff",
              }}
            >
              <Stack spacing={0.65}>
                {item.comentario ? (
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.45,
                      color: "text.primary",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>Comentario:</strong> {item.comentario}
                  </Typography>
                ) : null}

                {item.referencia ? (
                  <Typography variant="caption" color="text.secondary">
                    <strong>Referencia:</strong> {item.referencia}
                  </Typography>
                ) : null}

                {item.importacionArchivo ? (
                  <Typography variant="caption" color="text.secondary">
                    <strong>Importación:</strong> {item.importacionArchivo}
                    {item.importacionHoja ? ` · ${item.importacionHoja}` : ""}
                    {item.importacionFila ? ` · fila ${item.importacionFila}` : ""}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export default function VacacionesKardexReportePage() {
  const { showSnackbar } = useAppSnackbar();

  const [sucursalId, setSucursalId] = useState<number | "">("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [estatusLaboral, setEstatusLaboral] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [origen, setOrigen] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [search, setSearch] = useState("");

  const [orderBy, setOrderBy] = useState<SortKey>("fechaMovimiento");
  const [order, setOrder] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const reporteQuery = useMemo<VacacionesKardexReporteQuery>(
    () => ({
      sucursalId: sucursalId === "" ? null : sucursalId,
      departamentoId: departamentoId === "" ? null : departamentoId,
      estatusLaboral: estatusLaboral || null,
      tipoMovimiento: tipoMovimiento || null,
      origen: origen.trim() || null,
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
      soloActivos,
      search: search.trim() || null,
    }),
    [
      sucursalId,
      departamentoId,
      estatusLaboral,
      tipoMovimiento,
      origen,
      fechaDesde,
      fechaHasta,
      soloActivos,
      search,
    ]
  );

  const reporteQueryResult = useQuery({
    queryKey: ["vacaciones", "reportes", "kardex", reporteQuery],
    queryFn: () => getVacacionesKardexReporte(reporteQuery),
  });

  const sucursalesQuery = useQuery({
    queryKey: ["sucursales", "all"],
    queryFn: () => getSucursales(),
  });

  const departamentosQuery = useQuery({
    queryKey: ["departamentos", "all"],
    queryFn: () => getDepartamentos(),
  });

  const sucursales = (sucursalesQuery.data ?? []) as SucursalListItem[];
  const departamentos = (departamentosQuery.data ?? []) as DepartamentoListItem[];

  const result = reporteQueryResult.data;
  const rows = result?.items ?? [];

  const sortedRows = useMemo(
    () => sortRows(rows, orderBy, order),
    [rows, orderBy, order]
  );

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [reporteQuery, rowsPerPage]);

  const isLoading = reporteQueryResult.isLoading;
  const isRefreshing = reporteQueryResult.isFetching && !isLoading;

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (sucursalId !== "") count += 1;
    if (departamentoId !== "") count += 1;
    if (estatusLaboral) count += 1;
    if (tipoMovimiento) count += 1;
    if (origen.trim()) count += 1;
    if (fechaDesde) count += 1;
    if (fechaHasta) count += 1;
    if (!soloActivos) count += 1;
    if (search.trim()) count += 1;

    return count;
  }, [
    sucursalId,
    departamentoId,
    estatusLaboral,
    tipoMovimiento,
    origen,
    fechaDesde,
    fechaHasta,
    soloActivos,
    search,
  ]);

  const clearFilters = () => {
    setSucursalId("");
    setDepartamentoId("");
    setEstatusLaboral("");
    setTipoMovimiento("");
    setOrigen("");
    setFechaDesde("");
    setFechaHasta("");
    setSoloActivos(true);
    setSearch("");
    setPage(0);
  };

  const handleSort = (key: SortKey) => {
    setPage(0);

    if (orderBy === key) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setOrderBy(key);
    setOrder("asc");
  };

  async function handleExportXlsx() {
    try {
      setExportingXlsx(true);
      await exportVacacionesKardexXlsx(reporteQuery);
      showSnackbar("Reporte Excel generado correctamente.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo exportar el reporte en Excel.",
        "error"
      );
    } finally {
      setExportingXlsx(false);
    }
  }

  async function handleExportPdf() {
    try {
      setExportingPdf(true);
      await exportVacacionesKardexPdf(reporteQuery);
      showSnackbar("Reporte PDF generado correctamente.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo exportar el reporte en PDF.",
        "error"
      );
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <AppPage
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={
              isRefreshing ? <CircularProgress size={18} /> : <RefreshRoundedIcon />
            }
            onClick={() => reporteQueryResult.refetch()}
            disabled={isLoading || exportingXlsx || exportingPdf}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </Stack>
      }
    >
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <HeroBanner
            eyebrow="Vacaciones / Reportes"
            title="Kárdex de vacaciones"
            subtitle="Audita movimientos de vacaciones, saldos antes/después, origen, responsable y comentarios operativos."
            badge="Auditoría RH"
            icon={<AccountTreeRoundedIcon />}
            actions={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    activeFiltersCount > 0
                      ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""}`
                      : "Sin filtros"
                  }
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.24)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={`${formatNumber(rows.length)} movimiento${rows.length === 1 ? "" : "s"}`}
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.24)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </Stack>
            }
          />

          <Grid container spacing={2.5} sx={{ minWidth: 0 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Movimientos"
                value={result?.totalMovimientos ?? 0}
                subtitle="Registros visibles"
                icon={<TableViewRoundedIcon />}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Días positivos"
                value={formatDays(result?.totalDiasPositivos ?? 0)}
                subtitle="Aperturas, saldos y ajustes"
                icon={<AddCircleOutlineRoundedIcon />}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Días negativos"
                value={formatDays(result?.totalDiasNegativos ?? 0)}
                subtitle="Disfrutes, pagos o vencimientos"
                icon={<RemoveCircleOutlineRoundedIcon />}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Balance"
                value={formatDays(result?.balanceDias ?? 0)}
                subtitle="Suma neta de movimientos"
                icon={<ImportExportRoundedIcon />}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Disfrutes"
                value={result?.movimientosDisfrute ?? 0}
                subtitle="Movimientos de vacaciones tomadas"
                icon={<BeachAccessRoundedIcon />}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                title="Importación"
                value={result?.movimientosImportacion ?? 0}
                subtitle="Movimientos legacy detectados"
                icon={<TuneRoundedIcon />}
              />
            </Grid>

            <Grid size={12} sx={{ minWidth: 0 }}>
              <SectionCard
                title="Filtros"
                subtitle="Acota el kárdex por sucursal, departamento, tipo de movimiento, origen o rango de fechas."
                actions={
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        activeFiltersCount > 0
                          ? `${activeFiltersCount} filtro${activeFiltersCount === 1 ? "" : "s"}`
                          : "Sin filtros"
                      }
                    />

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FilterAltRoundedIcon />}
                      onClick={clearFilters}
                      disabled={activeFiltersCount === 0}
                    >
                      Limpiar
                    </Button>
                  </Stack>
                }
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Sucursal"
                      value={sucursalId}
                      onChange={(event) =>
                        setSucursalId(
                          event.target.value === "" ? "" : Number(event.target.value)
                        )
                      }
                      disabled={sucursalesQuery.isLoading}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {sucursales.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Departamento"
                      value={departamentoId}
                      onChange={(event) =>
                        setDepartamentoId(
                          event.target.value === "" ? "" : Number(event.target.value)
                        )
                      }
                      disabled={departamentosQuery.isLoading}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {departamentos.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Estatus laboral"
                      value={estatusLaboral}
                      onChange={(event) => setEstatusLaboral(event.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="ACTIVO">Activo</MenuItem>
                      <MenuItem value="BAJA">Baja</MenuItem>
                      <MenuItem value="REINGRESO">Reingreso</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo movimiento"
                      value={tipoMovimiento}
                      onChange={(event) => setTipoMovimiento(event.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {TIPO_MOVIMIENTO_OPTIONS.map((item) => (
                        <MenuItem key={item} value={item}>
                          {getTipoMovimientoVacacionLabel(item)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha desde"
                      value={fechaDesde}
                      onChange={(event) => setFechaDesde(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha hasta"
                      value={fechaHasta}
                      onChange={(event) => setFechaHasta(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Solo activos"
                      value={soloActivos ? "true" : "false"}
                      onChange={(event) =>
                        setSoloActivos(event.target.value === "true")
                      }
                    >
                      <MenuItem value="true">Sí</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Origen"
                      value={origen}
                      onChange={(event) => setOrigen(event.target.value)}
                      placeholder="EXCEL_LEGACY, MANUAL..."
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Buscar"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Empleado, RFC, NSS, comentario, origen, responsable..."
                      InputProps={{
                        startAdornment: (
                          <SearchRoundedIcon
                            fontSize="small"
                            style={{ marginRight: 8, opacity: 0.65 }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid size={12} sx={{ minWidth: 0 }}>
              <SectionCard
                title="Exportación"
                subtitle="Descarga el mismo resultado filtrado en formato Excel o PDF corporativo."
                actions={
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${formatNumber(rows.length)} movimiento${rows.length === 1 ? "" : "s"}`}
                  />
                }
              >
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={
                      exportingXlsx ? (
                        <CircularProgress size={18} />
                      ) : (
                        <TableViewRoundedIcon />
                      )
                    }
                    onClick={handleExportXlsx}
                    disabled={isLoading || exportingXlsx || exportingPdf}
                  >
                    {exportingXlsx ? "Exportando Excel..." : "Exportar Excel"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={
                      exportingPdf ? (
                        <CircularProgress size={18} />
                      ) : (
                        <PictureAsPdfRoundedIcon />
                      )
                    }
                    onClick={handleExportPdf}
                    disabled={isLoading || exportingXlsx || exportingPdf}
                  >
                    {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
                  </Button>
                </Stack>
              </SectionCard>
            </Grid>

            <Grid size={12} sx={{ minWidth: 0 }}>
              <SectionCard
                title="Detalle del kárdex"
                subtitle="Movimientos de vacaciones con saldo antes, saldo después, origen y responsable."
                actions={
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<ImportExportRoundedIcon />}
                    label={`Balance ${formatDays(result?.balanceDias ?? 0)} días`}
                  />
                }
              >
                {isLoading ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </Stack>
                ) : null}

                {reporteQueryResult.isError ? (
                  <Alert severity="error">
                    No se pudo cargar el reporte de kárdex. Revisa API, permisos o sesión.
                  </Alert>
                ) : null}

                {!isLoading && !reporteQueryResult.isError ? (
                  rows.length === 0 ? (
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <AccountTreeRoundedIcon
                        sx={{ fontSize: 46, color: "text.disabled", mb: 1 }}
                      />
                      <Typography fontWeight={800}>
                        Sin movimientos encontrados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ajusta los filtros o registra/importa movimientos de vacaciones.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
                      <TableContainer
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          border: "1px solid",
                          borderColor: "divider",
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                          overflowX: "auto",
                          overflowY: "auto",
                          maxHeight: 680,
                          "&::-webkit-scrollbar": {
                            height: 10,
                            width: 10,
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: alpha("#0f172a", 0.22),
                            borderRadius: 999,
                          },
                        }}
                      >
                        <Table
                          stickyHeader
                          size="small"
                          sx={{
                            minWidth: 1510,
                            "& .MuiTableCell-root": {
                              verticalAlign: "top",
                            },
                          }}
                        >
                          <TableHead
                            sx={{
                              "& .MuiTableCell-head": {
                                backgroundColor: "#f4f7fc",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              },
                            }}
                          >
                            <TableRow>
                              <SortableHeaderCell
                                label="Fecha"
                                sortKey="fechaMovimiento"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Núm."
                                sortKey="numEmpleado"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Empleado"
                                sortKey="nombreEmpleado"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Sucursal"
                                sortKey="sucursal"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Departamento"
                                sortKey="departamento"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Estatus"
                                sortKey="estatusLaboral"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Año"
                                sortKey="anioServicio"
                                orderBy={orderBy}
                                order={order}
                                align="center"
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Tipo"
                                sortKey="tipoMovimiento"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Días"
                                sortKey="dias"
                                orderBy={orderBy}
                                order={order}
                                align="right"
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Antes"
                                sortKey="saldoAntes"
                                orderBy={orderBy}
                                order={order}
                                align="right"
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Después"
                                sortKey="saldoDespues"
                                orderBy={orderBy}
                                order={order}
                                align="right"
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Origen"
                                sortKey="origen"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                              <SortableHeaderCell
                                label="Responsable"
                                sortKey="usuarioResponsable"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                              />
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {paginatedRows.map((item) => (
                              <VacacionesKardexRow
                                key={`${item.empleadoId}-${item.movimientoId}`}
                                item={item}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component="div"
                        count={sortedRows.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event) => {
                          setRowsPerPage(Number(event.target.value));
                          setPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage="Filas por página"
                        labelDisplayedRows={({ from, to, count }) =>
                          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                        }
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderTop: 0,
                          borderBottomLeftRadius: 12,
                          borderBottomRightRadius: 12,
                          backgroundColor: "#fff",
                        }}
                      />
                    </Box>
                  )
                ) : null}
              </SectionCard>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </AppPage>
  );
}
