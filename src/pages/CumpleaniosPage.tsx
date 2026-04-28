import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";

import {
  exportCumpleaniosPdf,
  exportCumpleaniosXlsx,
  getCumpleaniosHoy,
  getCumpleaniosMes,
  getCumpleaniosProximos,
  getCumpleaniosResumen,
  type CumpleaniosItem,
  type CumpleaniosReporteQuery,
  type CumpleaniosReporteScope,
} from "../api/cumpleanios.api";
import { getSucursales } from "../api/sucursales.api";
import { getDepartamentos } from "../api/departamentos.api";

type SucursalListItem =
  Awaited<ReturnType<typeof getSucursales>> extends Array<infer T> ? T : never;

type DepartamentoListItem =
  Awaited<ReturnType<typeof getDepartamentos>> extends Array<infer T>
    ? T
    : never;

function getMesNombre(mes: number) {
  return new Intl.DateTimeFormat("es-MX", { month: "long" }).format(
    new Date(2026, mes - 1, 1)
  );
}

function formatFechaDiaMes(item: CumpleaniosItem) {
  const date = new Date(2026, item.mes - 1, item.dia);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function getDiasLabel(diasRestantes: number) {
  if (diasRestantes === 0) return "Hoy";
  if (diasRestantes === 1) return "Mañana";
  return `En ${diasRestantes} días`;
}

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
}

function getPeriodoReporteLabel(scope: CumpleaniosReporteScope) {
  switch (scope) {
    case "hoy":
      return "Hoy";
    case "7dias":
      return "Próximos 7 días";
    case "30dias":
      return "Próximos 30 días";
    case "mes":
      return "Mes actual";
    case "custom":
      return "Personalizado";
    default:
      return "Próximos 30 días";
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function BirthdayPersonCard({ item }: { item: CumpleaniosItem }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Avatar src={item.fotoUrl ?? undefined} sx={{ width: 52, height: 52 }}>
        {getInitials(item.nombreCompleto)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography fontWeight={700} noWrap>
            {item.nombreCompleto}
          </Typography>

          <Chip
            size="small"
            color={item.esHoy ? "success" : "default"}
            label={getDiasLabel(item.diasRestantes)}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" noWrap>
          {item.puestoNombre || "Sin puesto"} ·{" "}
          {item.sucursalNombre || "Sin sucursal"}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            icon={<CakeRoundedIcon />}
            label={`${formatFechaDiaMes(item)} · ${item.edadQueCumple} años`}
          />

          {item.departamentoNombre ? (
            <Chip size="small" variant="outlined" label={item.departamentoNombre} />
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}

export default function CumpleaniosPage() {
  const today = new Date();
  const { showSnackbar } = useAppSnackbar();

  const [sucursalId, setSucursalId] = useState<number | "">("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [mesActual] = useState<number>(today.getMonth() + 1);
  const [anioActual] = useState<number>(today.getFullYear());

  const [scopeReporte, setScopeReporte] =
    useState<CumpleaniosReporteScope>("30dias");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const filtros = useMemo(
    () => ({
      sucursalId: sucursalId === "" ? null : sucursalId,
      departamentoId: departamentoId === "" ? null : departamentoId,
    }),
    [sucursalId, departamentoId]
  );

  const reporteQuery = useMemo<CumpleaniosReporteQuery>(
    () => ({
      sucursalId: filtros.sucursalId,
      departamentoId: filtros.departamentoId,
      scope: scopeReporte,
      fechaDesde: scopeReporte === "custom" ? fechaDesde || null : null,
      fechaHasta: scopeReporte === "custom" ? fechaHasta || null : null,
    }),
    [filtros, scopeReporte, fechaDesde, fechaHasta]
  );

  const resumenQuery = useQuery({
    queryKey: ["cumpleanios", "resumen", filtros],
    queryFn: () => getCumpleaniosResumen(filtros),
  });

  const hoyQuery = useQuery({
    queryKey: ["cumpleanios", "hoy", filtros],
    queryFn: () => getCumpleaniosHoy(filtros),
  });

  const proximosQuery = useQuery({
    queryKey: ["cumpleanios", "proximos", 30, filtros],
    queryFn: () => getCumpleaniosProximos(30, filtros),
  });

  const mesQuery = useQuery({
    queryKey: ["cumpleanios", "mes", mesActual, anioActual, filtros],
    queryFn: () => getCumpleaniosMes(mesActual, anioActual, filtros),
  });

  const sucursalesQuery = useQuery({
    queryKey: ["sucursales", "all"],
    queryFn: () => getSucursales(),
  });

  const departamentosQuery = useQuery({
    queryKey: ["departamentos", "all"],
    queryFn: () => getDepartamentos(),
  });

  const isLoading =
    resumenQuery.isLoading ||
    hoyQuery.isLoading ||
    proximosQuery.isLoading ||
    mesQuery.isLoading;

  const hasError =
    resumenQuery.isError ||
    hoyQuery.isError ||
    proximosQuery.isError ||
    mesQuery.isError;

  const isRefreshing =
    (resumenQuery.isFetching ||
      hoyQuery.isFetching ||
      proximosQuery.isFetching ||
      mesQuery.isFetching ||
      sucursalesQuery.isFetching ||
      departamentosQuery.isFetching) &&
    !isLoading;

  const resumen = resumenQuery.data;
  const hoy = hoyQuery.data ?? [];
  const proximos = proximosQuery.data ?? [];
  const delMes = mesQuery.data ?? [];

  const sucursales = (sucursalesQuery.data ?? []) as SucursalListItem[];
  const departamentos = (departamentosQuery.data ?? []) as DepartamentoListItem[];

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (sucursalId !== "") count += 1;
    if (departamentoId !== "") count += 1;
    return count;
  }, [sucursalId, departamentoId]);

  const canExport =
    !isLoading &&
    !hasError &&
    !exportingXlsx &&
    !exportingPdf &&
    !(scopeReporte === "custom" && (!fechaDesde || !fechaHasta));

  const handleRefresh = () => {
    void resumenQuery.refetch();
    void hoyQuery.refetch();
    void proximosQuery.refetch();
    void mesQuery.refetch();
    void sucursalesQuery.refetch();
    void departamentosQuery.refetch();
  };

  const clearFilters = () => {
    setSucursalId("");
    setDepartamentoId("");
  };

  async function handleExportXlsx() {
    if (scopeReporte === "custom" && (!fechaDesde || !fechaHasta)) {
      showSnackbar(
        "Captura fecha desde y fecha hasta para el reporte personalizado.",
        "error"
      );
      return;
    }

    try {
      setExportingXlsx(true);
      await exportCumpleaniosXlsx(reporteQuery);
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
    if (scopeReporte === "custom" && (!fechaDesde || !fechaHasta)) {
      showSnackbar(
        "Captura fecha desde y fecha hasta para el reporte personalizado.",
        "error"
      );
      return;
    }

    try {
      setExportingPdf(true);
      await exportCumpleaniosPdf(reporteQuery);
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
            onClick={handleRefresh}
            disabled={isLoading || exportingXlsx || exportingPdf}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        <HeroBanner
          title="Cumpleaños"
          subtitle="Consulta celebraciones del día, próximos cumpleaños y calendario del mes por sucursal o departamento."
          eyebrow="Capital humano"
          icon={<CelebrationRoundedIcon />}
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                label={
                  activeFiltersCount > 0
                    ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} activo${activeFiltersCount > 1 ? "s" : ""}`
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
                label={`Reporte: ${getPeriodoReporteLabel(scopeReporte)}`}
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
          <Grid size={{ xs: 12, md: 4 }}>
            <MetricCard
              title="Hoy"
              value={resumen?.hoy ?? 0}
              subtitle="Cumpleaños del día"
              icon={<TodayRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <MetricCard
              title="Próximos 7 días"
              value={resumen?.proximos7Dias ?? 0}
              subtitle="Celebraciones cercanas"
              icon={<EventRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <MetricCard
              title="Este mes"
              value={resumen?.esteMes ?? 0}
              subtitle={`Cumpleaños de ${getMesNombre(mesActual)}`}
              icon={<CalendarMonthRoundedIcon />}
            />
          </Grid>

          <Grid size={12}>
            <SectionCard
              title="Filtros"
              subtitle="Acota la vista por sucursal o departamento."
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Sucursal"
                    value={sucursalId}
                    onChange={(e) =>
                      setSucursalId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    disabled={sucursalesQuery.isLoading}
                    InputProps={{
                      startAdornment: (
                        <StoreRoundedIcon
                          fontSize="small"
                          style={{ marginRight: 8, opacity: 0.65 }}
                        />
                      ),
                    }}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {sucursales.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Departamento"
                    value={departamentoId}
                    onChange={(e) =>
                      setDepartamentoId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    disabled={departamentosQuery.isLoading}
                    InputProps={{
                      startAdornment: (
                        <ApartmentRoundedIcon
                          fontSize="small"
                          style={{ marginRight: 8, opacity: 0.65 }}
                        />
                      ),
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {departamentos.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>

          <Grid size={12}>
            <SectionCard
              title="Exportación"
              subtitle="Define el periodo del reporte y descarga Excel o PDF."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Periodo: ${getPeriodoReporteLabel(scopeReporte)}`}
                />
              }
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Periodo del reporte"
                    value={scopeReporte}
                    onChange={(e) =>
                      setScopeReporte(e.target.value as CumpleaniosReporteScope)
                    }
                  >
                    <MenuItem value="hoy">Hoy</MenuItem>
                    <MenuItem value="7dias">Próximos 7 días</MenuItem>
                    <MenuItem value="30dias">Próximos 30 días</MenuItem>
                    <MenuItem value="mes">Mes actual</MenuItem>
                    <MenuItem value="custom">Personalizado</MenuItem>
                  </TextField>
                </Grid>

                {scopeReporte === "custom" ? (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Fecha desde"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Fecha hasta"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </>
                ) : null}

                <Grid size={12}>
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
                      disabled={!canExport}
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
                      disabled={!canExport}
                    >
                      {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>

          {isLoading ? (
            <Grid size={12}>
              <SectionCard
                title="Cargando"
                subtitle="Preparando información de cumpleaños."
              >
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </Stack>
              </SectionCard>
            </Grid>
          ) : null}

          {hasError ? (
            <Grid size={12}>
              <Alert severity="error">
                No se pudo cargar el módulo de cumpleaños. Revisa la API o los permisos.
              </Alert>
            </Grid>
          ) : null}

          {!isLoading && !hasError ? (
            <>
              <Grid size={{ xs: 12, md: 5 }}>
                <SectionCard
                  title="Cumpleaños de hoy"
                  subtitle="Personal que celebra hoy."
                >
                  {hoy.length === 0 ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
                      <CakeRoundedIcon color="disabled" />
                      <Typography color="text.secondary">
                        Hoy no hay cumpleaños registrados.
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      {hoy.map((item) => (
                        <BirthdayPersonCard key={item.empleadoId} item={item} />
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <SectionCard
                  title="Próximos 30 días"
                  subtitle="Visión operativa para seguimiento y comunicación."
                >
                  {proximos.length === 0 ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
                      <EventRoundedIcon color="disabled" />
                      <Typography color="text.secondary">
                        No hay cumpleaños próximos con los filtros actuales.
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      {proximos.map((item) => (
                        <BirthdayPersonCard
                          key={`proximo-${item.empleadoId}`}
                          item={item}
                        />
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              </Grid>

              <Grid size={12}>
                <SectionCard
                  title={`Calendario del mes · ${getMesNombre(mesActual)}`}
                  subtitle="Vista mensual de celebraciones."
                >
                  {delMes.length === 0 ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
                      <CalendarMonthRoundedIcon color="disabled" />
                      <Typography color="text.secondary">
                        No hay cumpleaños registrados este mes con los filtros aplicados.
                      </Typography>
                    </Stack>
                  ) : (
                    <Grid container spacing={1.5}>
                      {delMes.map((item) => (
                        <Grid
                          size={{ xs: 12, md: 6, lg: 4 }}
                          key={`mes-${item.empleadoId}`}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                              height: "100%",
                            }}
                          >
                            <Avatar src={item.fotoUrl ?? undefined}>
                              {getInitials(item.nombreCompleto)}
                            </Avatar>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography fontWeight={700} noWrap>
                                {item.nombreCompleto}
                              </Typography>

                              <Typography variant="body2" color="text.secondary" noWrap>
                                {item.puestoNombre || "Sin puesto"}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 1 }}
                              >
                                <Chip
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  label={formatFechaDiaMes(item)}
                                />

                                <Chip
                                  size="small"
                                  variant="outlined"
                                  icon={<CakeRoundedIcon />}
                                  label={`${item.edadQueCumple} años`}
                                />
                              </Stack>
                            </Box>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </SectionCard>
              </Grid>
            </>
          ) : null}
        </Grid>
      </Stack>
    </AppPage>
  );
}