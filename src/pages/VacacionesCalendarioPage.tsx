import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  GlobalStyles,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  getVacacionesSolicitudes,
  type VacacionesSolicitud,
} from "../api/vacacionesSolicitudes.api";

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
});

const shortDayFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
});

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value?: number | null): string {
  return numberFormatter.format(Number(value ?? 0));
}

function formatDays(value?: number | null): string {
  return `${formatNumber(value)} días`;
}

function getInitials(value?: string | null): string {
  const parts = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "RH";

  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

function getEmployeeMeta(item: VacacionesSolicitud): string {
  return [item.sucursal, item.departamento, item.puesto]
    .filter(Boolean)
    .join(" · ");
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = getStartOfMonth(monthDate);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      iso: toIsoDate(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: toIsoDate(date) === toIsoDate(new Date()),
    };
  });
}

function solicitudIntersectsDay(item: VacacionesSolicitud, dayIso: string): boolean {
  return item.fechaInicio <= dayIso && item.fechaFin >= dayIso;
}

function solicitudIntersectsRange(
  item: VacacionesSolicitud,
  fechaDesde: string,
  fechaHasta: string
): boolean {
  return item.fechaFin >= fechaDesde && item.fechaInicio <= fechaHasta;
}

function EmployeeMiniCard({ item }: { item: VacacionesSolicitud }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: "0.68rem",
          fontWeight: 800,
          bgcolor: alpha("#1d4ed8", 0.1),
          color: "#1d4ed8",
        }}
      >
        {getInitials(item.nombreEmpleado)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.nombreEmpleado || "Empleado sin nombre"}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          #{item.numEmpleado}
          {getEmployeeMeta(item) ? ` · ${getEmployeeMeta(item)}` : ""}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function VacacionesCalendarioPage() {
  const [monthDate, setMonthDate] = useState(() => getStartOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => toIsoDate(new Date()));

  const monthStart = useMemo(() => getStartOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => getEndOfMonth(monthDate), [monthDate]);

  const fechaDesde = toIsoDate(monthStart);
  const fechaHasta = toIsoDate(monthEnd);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const solicitudesQuery = useQuery({
    queryKey: ["vacaciones", "calendario", fechaDesde, fechaHasta],
    queryFn: () =>
      getVacacionesSolicitudes({
        estatus: "APROBADA",
        fechaDesde,
        fechaHasta,
        page: 1,
        pageSize: 300,
      }),
  });

  const solicitudes = useMemo(
    () =>
      (solicitudesQuery.data?.items ?? []).filter((item) =>
        solicitudIntersectsRange(item, fechaDesde, fechaHasta)
      ),
    [fechaDesde, fechaHasta, solicitudesQuery.data?.items]
  );

  const selectedDaySolicitudes = useMemo(
    () =>
      solicitudes
        .filter((item) => solicitudIntersectsDay(item, selectedDay))
        .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
    [selectedDay, solicitudes]
  );

  const resumen = useMemo(() => {
    const empleados = new Set(solicitudes.map((item) => item.empleadoId));
    const dias = solicitudes.reduce(
      (total, item) => total + Number(item.diasSolicitados ?? 0),
      0
    );

    const sucursales = solicitudes.reduce<Record<string, number>>((acc, item) => {
      const key = item.sucursal || "Sin sucursal";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const sucursalPrincipal = Object.entries(sucursales).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      solicitudes: solicitudes.length,
      empleados: empleados.size,
      dias,
      sucursalPrincipal: sucursalPrincipal?.[0] ?? "—",
    };
  }, [solicitudes]);

  const goPreviousMonth = () => {
    const next = addMonths(monthDate, -1);
    setMonthDate(next);
    setSelectedDay(toIsoDate(getStartOfMonth(next)));
  };

  const goNextMonth = () => {
    const next = addMonths(monthDate, 1);
    setMonthDate(next);
    setSelectedDay(toIsoDate(getStartOfMonth(next)));
  };

  const goToday = () => {
    const today = new Date();
    setMonthDate(getStartOfMonth(today));
    setSelectedDay(toIsoDate(today));
  };

  return (
    <>
      <GlobalStyles
        styles={{
          "@media print": {
            "@page": {
              size: "landscape",
              margin: "10mm",
            },
            "html, body": {
              background: "#ffffff !important",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            },
            "body *": {
              visibility: "hidden !important",
            },
            ".gv-print-area, .gv-print-area *": {
              visibility: "visible !important",
            },
            ".gv-print-area": {
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              background: "#ffffff !important",
              padding: "0 !important",
              margin: "0 !important",
            },
            ".gv-no-print": {
              display: "none !important",
            },
            ".gv-print-card": {
              breakInside: "avoid",
              pageBreakInside: "avoid",
              boxShadow: "none !important",
            },
            ".gv-print-calendar-day": {
              minHeight: "86px !important",
              pageBreakInside: "avoid",
            },
            ".gv-print-title": {
              color: "#0f172a !important",
            },
          },
        }}
      />

      <AppPage
        actions={
          <Stack
            className="gv-no-print"
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={
                solicitudesQuery.isFetching ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              onClick={() => void solicitudesQuery.refetch()}
              disabled={solicitudesQuery.isFetching}
            >
              Actualizar
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
            >
              Imprimir
            </Button>

            <Button
              size="small"
              variant="contained"
              component={RouterLink}
              to="/vacaciones/solicitudes"
              startIcon={<BeachAccessRoundedIcon />}
            >
              Solicitudes
            </Button>
          </Stack>
        }
      >
        <Box className="gv-print-area">
          <Stack spacing={2.25}>
            <Box
              sx={{
                display: { xs: "none", print: "block" },
                mb: 1,
                pb: 1.5,
                borderBottom: "2px solid #0f172a",
              }}
            >
              <Typography
                className="gv-print-title"
                variant="h5"
                sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                GRANVIA Recursos Humanos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
                Calendario de vacaciones · {monthFormatter.format(monthDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rango {formatDate(fechaDesde)} — {formatDate(fechaHasta)}
              </Typography>
            </Box>

            <Box className="gv-no-print">
              <HeroBanner
                eyebrow="Vacaciones / Calendario"
                title="Calendario de vacaciones"
                subtitle="Consulta visualmente las vacaciones aprobadas por mes, empleado, sucursal y departamento."
                badge={monthFormatter.format(monthDate)}
              />
            </Box>

            {solicitudesQuery.isError ? (
              <Alert severity="error" className="gv-no-print">
                No se pudo cargar el calendario de vacaciones. Revisa el endpoint
                /api/Vacaciones/solicitudes.
              </Alert>
            ) : null}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                  print: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <MetricCard
                title="Solicitudes aprobadas"
                value={resumen.solicitudes}
                subtitle="Dentro del mes visible"
                icon={<EventAvailableRoundedIcon />}
              />

              <MetricCard
                title="Empleados"
                value={resumen.empleados}
                subtitle="Con vacaciones aprobadas"
                icon={<BeachAccessRoundedIcon />}
              />

              <MetricCard
                title="Días aprobados"
                value={formatDays(resumen.dias)}
                subtitle="Total solicitado"
                icon={<CalendarMonthRoundedIcon />}
              />

              <MetricCard
                title="Sucursal principal"
                value={resumen.sucursalPrincipal}
                subtitle="Mayor concentración"
                icon={<EventAvailableRoundedIcon />}
              />
            </Box>

            <SectionCard
              title={monthFormatter.format(monthDate)}
              subtitle={`Rango ${formatDate(fechaDesde)} — ${formatDate(fechaHasta)}`}
              actions={
                <Stack
                  className="gv-no-print"
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ChevronLeftRoundedIcon />}
                    onClick={goPreviousMonth}
                  >
                    Anterior
                  </Button>

                  <Button size="small" variant="outlined" onClick={goToday}>
                    Hoy
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ChevronRightRoundedIcon />}
                    onClick={goNextMonth}
                  >
                    Siguiente
                  </Button>
                </Stack>
              }
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 0.75,
                  mb: 0.75,
                }}
              >
                {weekDays.map((day) => (
                  <Typography
                    key={day}
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      color: "text.secondary",
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    {day}
                  </Typography>
                ))}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 0.75,
                }}
              >
                {calendarDays.map((day) => {
                  const daySolicitudes = solicitudes.filter((item) =>
                    solicitudIntersectsDay(item, day.iso)
                  );

                  const isSelected = selectedDay === day.iso;

                  return (
                    <Paper
                      key={day.iso}
                      className="gv-print-card gv-print-calendar-day"
                      variant="outlined"
                      onClick={() => setSelectedDay(day.iso)}
                      sx={{
                        minHeight: { xs: 96, md: 122 },
                        p: 0.9,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderColor: isSelected
                          ? alpha("#1d4ed8", 0.55)
                          : alpha("#0f172a", 0.09),
                        bgcolor: isSelected
                          ? alpha("#1d4ed8", 0.06)
                          : day.isCurrentMonth
                            ? alpha("#ffffff", 0.9)
                            : alpha("#f8fafc", 0.65),
                        opacity: day.isCurrentMonth ? 1 : 0.55,
                        transition:
                          "border-color 120ms ease, background-color 120ms ease",
                        "&:hover": {
                          borderColor: alpha("#1d4ed8", 0.45),
                          bgcolor: alpha("#1d4ed8", 0.045),
                        },
                        "@media print": {
                          borderColor: alpha("#0f172a", 0.16),
                          bgcolor: day.isCurrentMonth ? "#ffffff" : "#f8fafc",
                          opacity: day.isCurrentMonth ? 1 : 0.58,
                          cursor: "default",
                        },
                      }}
                    >
                      <Stack spacing={0.65}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 900,
                              color: day.isToday ? "#1d4ed8" : "text.primary",
                            }}
                          >
                            {day.date.getDate()}
                          </Typography>

                          {daySolicitudes.length > 0 ? (
                            <Chip
                              size="small"
                              label={daySolicitudes.length}
                              color={day.isToday ? "primary" : "default"}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                              }}
                            />
                          ) : null}
                        </Stack>

                        <Stack spacing={0.45}>
                          {daySolicitudes.slice(0, 3).map((item) => (
                            <Box
                              key={`${day.iso}-${item.id}`}
                              sx={{
                                px: 0.75,
                                py: 0.45,
                                borderRadius: 1.25,
                                bgcolor: alpha("#1d4ed8", 0.08),
                                border: `1px solid ${alpha("#1d4ed8", 0.12)}`,
                                overflow: "hidden",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  fontWeight: 800,
                                  color: "#1e3a8a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.nombreEmpleado}
                              </Typography>
                            </Box>
                          ))}

                          {daySolicitudes.length > 3 ? (
                            <Typography variant="caption" color="text.secondary">
                              +{daySolicitudes.length - 3} más
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </SectionCard>

            <SectionCard
              title="Listado del mes"
              subtitle="Solicitudes aprobadas incluidas en el calendario."
            >
              {solicitudes.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    border: "1px dashed",
                    borderColor: alpha("#2563eb", 0.18),
                    bgcolor: alpha("#2563eb", 0.035),
                    borderRadius: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Sin vacaciones aprobadas
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No hay registros aprobados dentro del mes visible.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {solicitudes
                    .slice()
                    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
                    .map((item) => (
                      <Paper
                        key={item.id}
                        className="gv-print-card"
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: alpha("#ffffff", 0.92),
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <EmployeeMiniCard item={item} />

                          <Stack
                            direction="row"
                            spacing={0.75}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={<CalendarMonthRoundedIcon />}
                              label={`${formatDate(item.fechaInicio)} — ${formatDate(
                                item.fechaFin
                              )}`}
                            />
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              label={formatDays(item.diasSolicitados)}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`SOL-VAC-${item.id}`}
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </SectionCard>

            <Box className="gv-no-print">
              <SectionCard
                title={`Detalle del día ${shortDayFormatter.format(
                  new Date(`${selectedDay}T00:00:00`)
                )}`}
                subtitle="Vacaciones aprobadas que cruzan el día seleccionado."
                actions={
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${selectedDaySolicitudes.length} registro(s)`}
                  />
                }
              >
              {selectedDaySolicitudes.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    border: "1px dashed",
                    borderColor: alpha("#2563eb", 0.18),
                    bgcolor: alpha("#2563eb", 0.035),
                    borderRadius: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Sin vacaciones aprobadas
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No hay empleados de vacaciones en este día.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {selectedDaySolicitudes.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: alpha("#ffffff", 0.92),
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.25}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                      >
                        <EmployeeMiniCard item={item} />

                        <Stack
                          direction="row"
                          spacing={0.75}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<CalendarMonthRoundedIcon />}
                            label={`${formatDate(item.fechaInicio)} — ${formatDate(
                              item.fechaFin
                            )}`}
                          />
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label={formatDays(item.diasSolicitados)}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`SOL-VAC-${item.id}`}
                          />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
              </SectionCard>
            </Box>
          </Stack>
        </Box>
      </AppPage>
    </>
  );
}