import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
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
import SectionCard from "../components/ui/SectionCard";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import { useAuth } from "../features/auth/AuthContext";

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

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? [])
    .map((role) => String(role).trim().toUpperCase())
    .filter(Boolean);
}

function hasRole(roles: string[], role: string): boolean {
  return roles.includes(role.toUpperCase());
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function BirthdayPersonCard({ item }: { item: CumpleaniosItem }) {
  return (
    <Box
      sx={{
        px: 1.45,
        py: 1.2,
        borderRadius: "16px",
        border: "1px solid",
        borderColor: item.esHoy ? "rgba(46, 125, 50, 0.28)" : "divider",
        bgcolor: item.esHoy ? "rgba(46, 125, 50, 0.05)" : "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.4} alignItems="center">
        <Avatar
          src={item.fotoUrl ?? undefined}
          sx={{
            width: 44,
            height: 44,
            bgcolor: item.esHoy ? "success.main" : "primary.main",
            fontWeight: 900,
          }}
        >
          {getInitials(item.nombreCompleto)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={0.8}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography fontWeight={900} noWrap>
              {item.nombreCompleto}
            </Typography>

            <Chip
              size="small"
              color={item.esHoy ? "success" : "default"}
              label={getDiasLabel(item.diasRestantes)}
              sx={{ fontWeight: 850 }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" noWrap>
            {item.puestoNombre || "Sin puesto"} ·{" "}
            {item.sucursalNombre || "Sin sucursal"}
          </Typography>

          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 0.9 }}>
            <Chip
              size="small"
              variant="outlined"
              icon={<CakeRoundedIcon />}
              label={`${formatFechaDiaMes(item)} · ${item.edadQueCumple} años`}
              sx={{ fontWeight: 800 }}
            />

            {item.departamentoNombre ? (
              <Chip
                size="small"
                variant="outlined"
                label={item.departamentoNombre}
                sx={{ fontWeight: 800 }}
              />
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function MonthBirthdayCard({ item }: { item: CumpleaniosItem }) {
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: "15px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Avatar
          src={item.fotoUrl ?? undefined}
          sx={{ width: 42, height: 42, bgcolor: "primary.main", fontWeight: 900 }}
        >
          {getInitials(item.nombreCompleto)}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={900} noWrap>
            {item.nombreCompleto}
          </Typography>

          <Typography variant="body2" color="text.secondary" noWrap>
            {item.puestoNombre || "Sin puesto"}
          </Typography>

          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
            <Chip
              size="small"
              color={item.esHoy ? "success" : "primary"}
              variant="outlined"
              label={formatFechaDiaMes(item)}
              sx={{ fontWeight: 800 }}
            />

            <Chip
              size="small"
              variant="outlined"
              icon={<CakeRoundedIcon />}
              label={`${item.edadQueCumple} años`}
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function BirthdayStatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "18px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Stack spacing={1.1}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {title}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 950,
                lineHeight: 1,
                letterSpacing: "-0.035em",
              }}
            >
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyCelebrations({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: "16px",
        textAlign: "center",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ color: "text.disabled", mb: 1 }}>{icon}</Box>
      <Typography fontWeight={900}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {message}
      </Typography>
    </Paper>
  );
}

export default function CumpleaniosPage() {
  const today = new Date();
  const { showSnackbar } = useAppSnackbar();
  const { roles } = useAuth();

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

  const isAdminOrRrhh =
    hasRole(normalizedRoles, "ADMIN") || hasRole(normalizedRoles, "RRHH");

  const isJefeOnly = hasRole(normalizedRoles, "JEFE") && !isAdminOrRrhh;

  // true = vista sin herramientas administrativas.
  // Aplica para JEFE, EMPLEADO y CONSULTA.
  const isEmpleadoOnly = !isAdminOrRrhh;

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
    enabled: !isEmpleadoOnly,
    staleTime: 5 * 60 * 1000,
  });

  const departamentosQuery = useQuery({
    queryKey: ["departamentos", "all"],
    queryFn: () => getDepartamentos(),
    enabled: !isEmpleadoOnly,
    staleTime: 5 * 60 * 1000,
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
    !isEmpleadoOnly &&
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

    if (!isEmpleadoOnly) {
      void sucursalesQuery.refetch();
      void departamentosQuery.refetch();
    }
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
    <AppPage>
      <Stack spacing={1.75}>
        <Card
          elevation={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
            background:
              "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          }}
        >
          <CardContent sx={{ p: { xs: 1.45, md: 1.65 }, "&:last-child": { pb: { xs: 1.45, md: 1.65 } } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: alpha("#ffffff", 0.72),
                    fontWeight: 900,
                    letterSpacing: 1.1,
                  }}
                >
                  {isEmpleadoOnly ? "Vista informativa" : "Capital humano"}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 950,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.08,
                  }}
                >
                  Cumpleaños
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: alpha("#ffffff", 0.84), mt: 0.8 }}
                >
                  {isEmpleadoOnly
                    ? isJefeOnly
                      ? "Consulta celebraciones y próximos cumpleaños del personal bajo tu responsabilidad."
                      : "Consulta próximos cumpleaños y celebraciones del equipo."
                    : "Consulta celebraciones del día, próximos cumpleaños y calendario del mes por sucursal o departamento."}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: { xs: "100%", md: "auto" },
                  minWidth: { md: 360 },
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: alpha("#ffffff", 0.14),
                  bgcolor: alpha("#ffffff", 0.08),
                  p: 1.25,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.4}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                        {resumen?.hoy ?? 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                        hoy
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                        {resumen?.proximos7Dias ?? 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                        7 días
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>
                        {resumen?.esteMes ?? 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                        mes
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    startIcon={
                      isRefreshing ? <CircularProgress size={15} color="inherit" /> : <RefreshRoundedIcon />
                    }
                    onClick={handleRefresh}
                    disabled={isLoading || exportingXlsx || exportingPdf}
                    sx={{
                      bgcolor: "#ffffff",
                      color: "primary.main",
                      minHeight: 28,
                      px: 1.25,
                      py: 0.35,
                      borderRadius: "9px",
                      fontSize: "0.76rem",
                      fontWeight: 850,
                      lineHeight: 1.15,
                      boxShadow: "none",
                      whiteSpace: "nowrap",
                      "& .MuiButton-startIcon": {
                        mr: 0.45,
                        "& svg": {
                          fontSize: 17,
                        },
                      },
                      "&:hover": {
                        bgcolor: alpha("#ffffff", 0.92),
                        boxShadow: "none",
                      },
                    }}
                  >
                    {isRefreshing ? "Actualizando..." : "Actualizar"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.25,
          }}
        >
          <BirthdayStatCard
            title="Hoy"
            value={resumen?.hoy ?? 0}
            subtitle="Celebraciones del día"
            icon={<TodayRoundedIcon fontSize="small" />}
          />

          <BirthdayStatCard
            title="Próximos 7 días"
            value={resumen?.proximos7Dias ?? 0}
            subtitle="Próximas celebraciones"
            icon={<EventRoundedIcon fontSize="small" />}
          />

          <BirthdayStatCard
            title="Este mes"
            value={resumen?.esteMes ?? 0}
            subtitle={`Cumpleaños de ${getMesNombre(mesActual)}`}
            icon={<CalendarMonthRoundedIcon fontSize="small" />}
          />
        </Box>

        {!isEmpleadoOnly ? (
          <>
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
                    sx={{ borderRadius: "10px", fontWeight: 850 }}
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
                      sx={{ borderRadius: "10px", fontWeight: 850 }}
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
                      sx={{ borderRadius: "10px", fontWeight: 850 }}
                    >
                      {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          </>
        ) : null}

        {isLoading ? (
          <SectionCard
            title="Cargando"
            subtitle="Preparando información de cumpleaños."
          >
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          </SectionCard>
        ) : null}

        {hasError ? (
          <Alert severity="error">
            No se pudo cargar el módulo de cumpleaños. Revisa la API o los permisos.
          </Alert>
        ) : null}

        {!isLoading && !hasError ? (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "0.85fr 1.15fr",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <SectionCard
                title={isEmpleadoOnly ? "Celebraciones de hoy" : "Cumpleaños de hoy"}
                subtitle={
                  isEmpleadoOnly
                    ? "Personas que celebran hoy."
                    : "Personal que celebra hoy."
                }
              >
                {hoy.length === 0 ? (
                  <EmptyCelebrations
                    icon={<CakeRoundedIcon color="disabled" />}
                    title="Sin celebraciones hoy"
                    message="Hoy no hay cumpleaños registrados."
                  />
                ) : (
                  <Stack spacing={1.2}>
                    {hoy.map((item) => (
                      <BirthdayPersonCard key={item.empleadoId} item={item} />
                    ))}
                  </Stack>
                )}
              </SectionCard>

              <SectionCard
                title="Próximos cumpleaños"
                subtitle={
                  isEmpleadoOnly
                    ? "Celebraciones cercanas para tener presentes."
                    : "Visión operativa para seguimiento y comunicación."
                }
              >
                {proximos.length === 0 ? (
                  <EmptyCelebrations
                    icon={<EventRoundedIcon color="disabled" />}
                    title="Sin próximos cumpleaños"
                    message={
                      isEmpleadoOnly
                        ? "No hay cumpleaños próximos del equipo."
                        : "No hay cumpleaños próximos con los filtros actuales."
                    }
                  />
                ) : (
                  <Stack spacing={1.2}>
                    {proximos.map((item) => (
                      <BirthdayPersonCard
                        key={`proximo-${item.empleadoId}`}
                        item={item}
                      />
                    ))}
                  </Stack>
                )}
              </SectionCard>
            </Box>

            <SectionCard
              title={`Calendario del mes · ${getMesNombre(mesActual)}`}
              subtitle="Vista mensual de celebraciones."
            >
              {delMes.length === 0 ? (
                <EmptyCelebrations
                  icon={<CalendarMonthRoundedIcon color="disabled" />}
                  title="Sin cumpleaños este mes"
                  message={
                    isEmpleadoOnly
                      ? "No hay cumpleaños registrados este mes en la vista actual."
                      : "No hay cumpleaños registrados este mes con los filtros aplicados."
                  }
                />
              ) : (
                <Grid container spacing={1.5}>
                  {delMes.map((item) => (
                    <Grid
                      size={{ xs: 12, md: 6, lg: 4 }}
                      key={`mes-${item.empleadoId}`}
                    >
                      <MonthBirthdayCard item={item} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </SectionCard>
          </>
        ) : null}
      </Stack>
    </AppPage>
  );
}



