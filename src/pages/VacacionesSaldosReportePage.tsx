import { useMemo, useState } from "react";
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
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

import { getSucursales } from "../api/sucursales.api";
import { getDepartamentos } from "../api/departamentos.api";
import {
  exportVacacionesSaldosPdf,
  exportVacacionesSaldosXlsx,
  getEstatusLaboralLabel,
  getEstatusPeriodoLabel,
  getVacacionesSaldosReporte,
  type VacacionesSaldosReporteQuery,
  type VacacionesSaldosReporteRow,
} from "../api/vacacionesReportes.api";

type SucursalListItem =
  Awaited<ReturnType<typeof getSucursales>> extends Array<infer T> ? T : never;

type DepartamentoListItem =
  Awaited<ReturnType<typeof getDepartamentos>> extends Array<infer T>
    ? T
    : never;

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

function getTodayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function buildSaldoChipSx(value: number) {
  if (value > 0) {
    return {
      color: "#166534",
      borderColor: alpha("#16a34a", 0.22),
      backgroundColor: alpha("#16a34a", 0.05),
      fontWeight: 800,
    };
  }

  return {
    color: "#475569",
    borderColor: alpha("#475569", 0.18),
    backgroundColor: alpha("#475569", 0.04),
    fontWeight: 800,
  };
}

function VacacionesSaldoRow({ item }: { item: VacacionesSaldosReporteRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Stack spacing={0.4}>
          <Typography fontWeight={800}>{item.numEmpleado}</Typography>
          <Typography variant="caption" color="text.secondary">
            ID {item.empleadoId}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack spacing={0.4}>
          <Typography fontWeight={800}>{item.nombreEmpleado}</Typography>
          <Typography variant="caption" color="text.secondary">
            {item.puesto || "Sin puesto"}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>{item.sucursal || "Sin sucursal"}</TableCell>
      <TableCell>{item.departamento || "Sin departamento"}</TableCell>

      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          label={getEstatusLaboralLabel(item.estatusLaboral)}
          color={item.activo ? "success" : "warning"}
        />
      </TableCell>

      <TableCell>{formatDate(item.fechaIngreso)}</TableCell>

      <TableCell align="center">
        <Chip size="small" variant="outlined" label={item.anioServicio} />
      </TableCell>

      <TableCell>{formatDate(item.fechaInicio)}</TableCell>
      <TableCell>{formatDate(item.fechaFin)}</TableCell>
      <TableCell>{formatDate(item.fechaLimiteDisfrute)}</TableCell>

      <TableCell align="right">{formatDays(item.diasDerecho)}</TableCell>
      <TableCell align="right">{formatDays(item.diasTomados)}</TableCell>
      <TableCell align="right">{formatDays(item.diasPagados)}</TableCell>
      <TableCell align="right">{formatDays(item.diasVencidos)}</TableCell>

      <TableCell align="right">
        <Chip
          size="small"
          variant="outlined"
          label={formatDays(item.saldo)}
          sx={buildSaldoChipSx(item.saldo)}
        />
      </TableCell>

      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          color={item.estaVencido ? "error" : "default"}
          icon={item.estaVencido ? <WarningAmberRoundedIcon /> : undefined}
          label={
            item.estaVencido
              ? "Vencido"
              : getEstatusPeriodoLabel(item.estatusPeriodo)
          }
        />
      </TableCell>
    </TableRow>
  );
}

export default function VacacionesSaldosReportePage() {
  const { showSnackbar } = useAppSnackbar();

  const [sucursalId, setSucursalId] = useState<number | "">("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [estatusLaboral, setEstatusLaboral] = useState("");
  const [fechaCorte, setFechaCorte] = useState(getTodayInputValue());
  const [soloConSaldo, setSoloConSaldo] = useState(false);
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [soloActivos, setSoloActivos] = useState(true);
  const [search, setSearch] = useState("");

  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const reporteQuery = useMemo<VacacionesSaldosReporteQuery>(
    () => ({
      sucursalId: sucursalId === "" ? null : sucursalId,
      departamentoId: departamentoId === "" ? null : departamentoId,
      estatusLaboral: estatusLaboral || null,
      fechaCorte: fechaCorte || null,
      soloConSaldo,
      soloVencidos,
      soloActivos,
      search: search.trim() || null,
    }),
    [
      sucursalId,
      departamentoId,
      estatusLaboral,
      fechaCorte,
      soloConSaldo,
      soloVencidos,
      soloActivos,
      search,
    ]
  );

  const reporteQueryResult = useQuery({
    queryKey: ["vacaciones", "reportes", "saldos", reporteQuery],
    queryFn: () => getVacacionesSaldosReporte(reporteQuery),
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

  const isLoading = reporteQueryResult.isLoading;
  const isRefreshing = reporteQueryResult.isFetching && !isLoading;

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (sucursalId !== "") count += 1;
    if (departamentoId !== "") count += 1;
    if (estatusLaboral) count += 1;
    if (fechaCorte) count += 1;
    if (soloConSaldo) count += 1;
    if (soloVencidos) count += 1;
    if (soloActivos) count += 1;
    if (search.trim()) count += 1;

    return count;
  }, [
    sucursalId,
    departamentoId,
    estatusLaboral,
    fechaCorte,
    soloConSaldo,
    soloVencidos,
    soloActivos,
    search,
  ]);

  const clearFilters = () => {
    setSucursalId("");
    setDepartamentoId("");
    setEstatusLaboral("");
    setFechaCorte(getTodayInputValue());
    setSoloConSaldo(false);
    setSoloVencidos(false);
    setSoloActivos(true);
    setSearch("");
  };

  async function handleExportXlsx() {
    try {
      setExportingXlsx(true);
      await exportVacacionesSaldosXlsx(reporteQuery);
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
      await exportVacacionesSaldosPdf(reporteQuery);
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
      <Stack spacing={2.5}>
        <HeroBanner
          eyebrow="Vacaciones / Reportes"
          title="Saldos de vacaciones"
          subtitle="Consulta saldos disponibles, periodos vencidos y acumulados por empleado con exportación corporativa en Excel y PDF."
          badge="Control RH"
          icon={<BeachAccessRoundedIcon />}
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
                label={`Corte: ${formatDate(fechaCorte)}`}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.24)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
            </Stack>
          }
        />

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              title="Registros"
              value={result?.totalRegistros ?? 0}
              subtitle="Periodos visibles"
              icon={<TableViewRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              title="Empleados con saldo"
              value={result?.empleadosConSaldo ?? 0}
              subtitle="Saldo mayor a cero"
              icon={<BeachAccessRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              title="Saldo total"
              value={formatDays(result?.totalSaldo ?? 0)}
              subtitle="Días disponibles"
              icon={<SavingsRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              title="Vencidos"
              value={result?.periodosVencidos ?? 0}
              subtitle={`${formatDays(result?.totalDiasVencidos ?? 0)} días vencidos`}
              icon={<ErrorOutlineRoundedIcon />}
            />
          </Grid>

          <Grid size={12}>
            <SectionCard
              title="Filtros"
              subtitle="Acota el reporte por sucursal, departamento, estatus o fecha de corte."
              actions={
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${activeFiltersCount} filtro${activeFiltersCount === 1 ? "" : "s"}`}
                  />

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FilterAltRoundedIcon />}
                    onClick={clearFilters}
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
                    fullWidth
                    type="date"
                    label="Fecha corte"
                    value={fechaCorte}
                    onChange={(event) => setFechaCorte(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Solo activos"
                    value={soloActivos ? "true" : "false"}
                    onChange={(event) => setSoloActivos(event.target.value === "true")}
                  >
                    <MenuItem value="true">Sí</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Solo con saldo"
                    value={soloConSaldo ? "true" : "false"}
                    onChange={(event) => setSoloConSaldo(event.target.value === "true")}
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Sí</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Solo vencidos"
                    value={soloVencidos ? "true" : "false"}
                    onChange={(event) => setSoloVencidos(event.target.value === "true")}
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Sí</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Buscar"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Empleado, RFC, NSS..."
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

          <Grid size={12}>
            <SectionCard
              title="Exportación"
              subtitle="Descarga el mismo resultado filtrado en formato Excel o PDF corporativo."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${formatNumber(rows.length)} registro${rows.length === 1 ? "" : "s"}`}
                />
              }
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={
                    exportingXlsx ? <CircularProgress size={18} /> : <TableViewRoundedIcon />
                  }
                  onClick={handleExportXlsx}
                  disabled={isLoading || exportingXlsx || exportingPdf}
                >
                  {exportingXlsx ? "Exportando Excel..." : "Exportar Excel"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    exportingPdf ? <CircularProgress size={18} /> : <PictureAsPdfRoundedIcon />
                  }
                  onClick={handleExportPdf}
                  disabled={isLoading || exportingXlsx || exportingPdf}
                >
                  {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
                </Button>
              </Stack>
            </SectionCard>
          </Grid>

          <Grid size={12}>
            <SectionCard
              title="Detalle de saldos"
              subtitle="Periodos vacacionales detectados con derecho, uso, vencimiento y saldo."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<CalculateRoundedIcon />}
                  label={`${formatDays(result?.totalSaldo ?? 0)} días disponibles`}
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
                  No se pudo cargar el reporte de saldos. Revisa API, permisos o sesión.
                </Alert>
              ) : null}

              {!isLoading && !reporteQueryResult.isError ? (
                rows.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <BeachAccessRoundedIcon
                      sx={{ fontSize: 46, color: "text.disabled", mb: 1 }}
                    />
                    <Typography fontWeight={800}>Sin saldos encontrados</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ajusta los filtros o genera/importa periodos de vacaciones.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      overflowX: "auto",
                      maxHeight: 680,
                    }}
                  >
                    <Table stickyHeader size="small" sx={{ minWidth: 1450 }}>
                      <TableHead
                        sx={{
                          "& .MuiTableCell-head": {
                            backgroundColor: "#f4f7fc",
                            fontWeight: 800,
                          },
                        }}
                      >
                        <TableRow>
                          <TableCell>Núm.</TableCell>
                          <TableCell>Empleado</TableCell>
                          <TableCell>Sucursal</TableCell>
                          <TableCell>Departamento</TableCell>
                          <TableCell>Estatus</TableCell>
                          <TableCell>Ingreso</TableCell>
                          <TableCell align="center">Año</TableCell>
                          <TableCell>Inicio</TableCell>
                          <TableCell>Fin</TableCell>
                          <TableCell>Límite</TableCell>
                          <TableCell align="right">Derecho</TableCell>
                          <TableCell align="right">Tomados</TableCell>
                          <TableCell align="right">Pagados</TableCell>
                          <TableCell align="right">Vencidos</TableCell>
                          <TableCell align="right">Saldo</TableCell>
                          <TableCell>Periodo</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {rows.map((item) => (
                          <VacacionesSaldoRow
                            key={`${item.empleadoId}-${item.vacacionPeriodoId}`}
                            item={item}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              ) : null}
            </SectionCard>
          </Grid>
        </Grid>
      </Stack>
    </AppPage>
  );
}