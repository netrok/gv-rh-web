import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  getVacacionesDashboard,
  type VacacionesDashboardAniversario,
  type VacacionesDashboardMovimiento,
  type VacacionesDashboardPeriodoVencer,
  type VacacionesDashboardSaldoAlto,
  type VacacionesDashboardSolicitud,
} from "../api/vacacionesDashboard.api";
import { getTipoMovimientoVacacionLabel } from "../api/vacaciones.api";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

const daysFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type ChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

function formatNumber(value?: number | null): string {
  return numberFormatter.format(Number(value ?? 0));
}

function formatDays(value?: number | null): string {
  return `${daysFormatter.format(Number(value ?? 0))} días`;
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

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getEmployeeMeta(item: {
  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;
}): string {
  return (
    [item.sucursal, item.departamento, item.puesto].filter(Boolean).join(" · ") ||
    "Sin ubicación organizacional"
  );
}

function getSolicitudStatusLabel(value?: string | null): string {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "PENDIENTE") return "Pendiente";
  if (raw === "APROBADA") return "Aprobada";
  if (raw === "RECHAZADA") return "Rechazada";
  if (raw === "CANCELADA") return "Cancelada";

  return raw || "—";
}

function getSolicitudStatusColor(value?: string | null): ChipColor {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "APROBADA") return "success";
  if (raw === "RECHAZADA") return "error";
  if (raw === "CANCELADA") return "default";

  return "warning";
}

function getDiasParaInicioLabel(value?: number | null): string {
  const dias = Number(value ?? 0);

  if (dias < 0) return "En curso / pasada";
  if (dias === 0) return "Inicia hoy";
  if (dias === 1) return "Inicia mañana";

  return `Inicia en ${formatNumber(dias)} días`;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
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
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  );
}

function EmployeeCell({
  nombre,
  numEmpleado,
  meta,
}: {
  nombre: string;
  numEmpleado: string;
  meta?: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: "0.75rem",
          fontWeight: 800,
          bgcolor: alpha("#1d4ed8", 0.1),
          color: "#1d4ed8",
        }}
      >
        {getInitials(nombre)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: { xs: 180, md: 260 },
          }}
        >
          {nombre || "Empleado sin nombre"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          #{numEmpleado} {meta ? `· ${meta}` : ""}
        </Typography>
      </Box>
    </Stack>
  );
}

function TopSaldosTable({ items }: { items: VacacionesDashboardSaldoAlto[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin saldos altos"
        description="No hay empleados activos con saldo disponible registrado."
      />
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell align="right">Saldo</TableCell>
            <TableCell align="right">Ciclo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.empleadoId} hover>
              <TableCell>
                <EmployeeCell
                  nombre={item.nombreEmpleado}
                  numEmpleado={item.numEmpleado}
                  meta={getEmployeeMeta(item)}
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDays(item.saldo)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.periodosAbiertos} periodo(s)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip size="small" variant="outlined" label={`Ciclo ${item.cicloLaboral}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PeriodosVencerTable({ items }: { items: VacacionesDashboardPeriodoVencer[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin vencimientos próximos"
        description="No hay periodos con saldo por vencer en los próximos 30 días."
      />
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell>Vence</TableCell>
            <TableCell align="right">Saldo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.vacacionPeriodoId} hover>
              <TableCell>
                <EmployeeCell
                  nombre={item.nombreEmpleado}
                  numEmpleado={item.numEmpleado}
                  meta={`Año ${item.anioServicio} · Ciclo ${item.cicloLaboral}`}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDate(item.fechaLimiteDisfrute)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.diasParaVencer <= 0
                    ? "Vence hoy"
                    : `En ${item.diasParaVencer} día(s)`}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDays(item.saldo)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MovimientosTable({ items }: { items: VacacionesDashboardMovimiento[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin movimientos recientes"
        description="Aún no hay movimientos de vacaciones para mostrar."
      />
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Movimiento</TableCell>
            <TableCell>Empleado</TableCell>
            <TableCell align="right">Días</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.movimientoId} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {getTipoMovimientoVacacionLabel(item.tipoMovimiento)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(item.createdAtUtc)}
                  {item.origen ? ` · ${item.origen}` : ""}
                </Typography>
              </TableCell>
              <TableCell>
                <EmployeeCell
                  nombre={item.nombreEmpleado}
                  numEmpleado={item.numEmpleado}
                  meta={`Ciclo ${item.cicloLaboral}`}
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDays(item.dias)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Saldo {formatDays(item.saldoDespues)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SolicitudesTable({
  items,
  emptyTitle,
  emptyDescription,
  mode,
}: {
  items: VacacionesDashboardSolicitud[];
  emptyTitle: string;
  emptyDescription: string;
  mode: "pendientes" | "aprobadas";
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell>Periodo</TableCell>
            <TableCell align="right">Días</TableCell>
            <TableCell>Estatus</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => (
            <TableRow key={`${mode}-${item.solicitudId}`} hover>
              <TableCell>
                <EmployeeCell
                  nombre={item.nombreEmpleado}
                  numEmpleado={item.numEmpleado}
                  meta={getEmployeeMeta(item)}
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDate(item.fechaInicio)} — {formatDate(item.fechaFin)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  SOL-VAC-{item.solicitudId}
                  {mode === "pendientes"
                    ? ` · Solicitada ${formatDateTime(item.createdAtUtc)}`
                    : ` · ${getDiasParaInicioLabel(item.diasParaInicio)}`}
                </Typography>

                {item.comentarioEmpleado ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mt: 0.25,
                      maxWidth: 340,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.comentarioEmpleado}
                  </Typography>
                ) : null}
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {formatDays(item.diasSolicitados)}
                </Typography>
                {item.aprobadorEmpleado ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.aprobadorEmpleado}
                  </Typography>
                ) : null}
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  color={getSolicitudStatusColor(item.estatus)}
                  variant="outlined"
                  label={getSolicitudStatusLabel(item.estatusNombre || item.estatus)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AniversariosList({ items }: { items: VacacionesDashboardAniversario[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin aniversarios próximos"
        description="No hay ciclos laborales por cumplir en los próximos 30 días."
      />
    );
  }

  return (
    <Stack spacing={1.1}>
      {items.map((item) => (
        <Box
          key={item.empleadoId}
          sx={{
            p: 1.35,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha("#0f172a", 0.08),
            bgcolor: alpha("#ffffff", 0.72),
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <EmployeeCell
              nombre={item.nombreEmpleado}
              numEmpleado={item.numEmpleado}
              meta={getEmployeeMeta(item)}
            />

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                icon={<CalendarMonthRoundedIcon />}
                label={formatDate(item.proximoAniversario)}
              />
              <Chip
                size="small"
                color={item.diasRestantes <= 7 ? "warning" : "default"}
                variant="outlined"
                label={
                  item.diasRestantes <= 0
                    ? "Hoy"
                    : `${item.diasRestantes} día(s)`
                }
              />
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Base ciclo: {formatDate(item.fechaBaseCicloLaboral)} ·{" "}
            {item.aniosServicioCumplidos} año(s) cumplidos
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

export default function VacacionesDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["vacaciones", "dashboard"],
    queryFn: getVacacionesDashboard,
  });

  const dashboard = dashboardQuery.data;

  const eficienciaUso = useMemo(() => {
    const derecho = dashboard?.diasDerechoTotal ?? 0;
    const tomados = dashboard?.diasTomadosTotal ?? 0;

    if (derecho <= 0) return 0;

    return Math.round((tomados / derecho) * 100);
  }, [dashboard?.diasDerechoTotal, dashboard?.diasTomadosTotal]);

  return (
    <AppPage
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              dashboardQuery.isFetching ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={() => void dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            Actualizar
          </Button>

          <Button
            size="small"
            variant="outlined"
            component={RouterLink}
            to="/vacaciones/solicitudes"
            startIcon={<BeachAccessRoundedIcon />}
          >
            Solicitudes
          </Button>

          <Button
            size="small"
            variant="contained"
            component={RouterLink}
            to="/vacaciones/reportes/saldos"
            startIcon={<TableViewRoundedIcon />}
          >
            Reporte saldos
          </Button>
        </Stack>
      }
    >
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <Stack spacing={2.25} sx={{ minWidth: 0 }}>
          <HeroBanner
            eyebrow="Vacaciones / Resumen"
            title="Centro operativo de vacaciones"
            subtitle="Monitorea saldos, solicitudes pendientes, vacaciones aprobadas, vencimientos y movimientos recientes desde una sola vista."
            badge={dashboard?.fechaCorte ? `Corte ${formatDate(dashboard.fechaCorte)}` : "RH"}
          />

          {dashboardQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el dashboard de vacaciones. Revisa que el backend tenga activo
              el endpoint /api/Vacaciones/dashboard.
            </Alert>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <MetricCard
              title="Empleados con saldo"
              value={formatNumber(dashboard?.empleadosConSaldo)}
              subtitle={`${formatNumber(dashboard?.empleadosActivos)} activos revisados`}
              icon={<BeachAccessRoundedIcon />}
            />

            <MetricCard
              title="Saldo disponible"
              value={formatDays(dashboard?.saldoTotal)}
              subtitle="Total pendiente por disfrutar"
              icon={<SavingsRoundedIcon />}
            />

            <MetricCard
              title="Solicitudes pendientes"
              value={formatNumber(dashboard?.solicitudesPendientes)}
              subtitle={`${formatDays(dashboard?.diasSolicitadosPendientes)} por aprobar`}
              icon={<HourglassBottomRoundedIcon />}
            />

            <MetricCard
              title="Aprobadas del mes"
              value={formatNumber(dashboard?.solicitudesAprobadasMes)}
              subtitle={`${formatDays(dashboard?.diasAprobadosMes)} aprobados`}
              icon={<EventAvailableRoundedIcon />}
            />

            <MetricCard
              title="Por vencer"
              value={formatNumber(dashboard?.periodosPorVencer30Dias)}
              subtitle="Periodos en próximos 30 días"
              icon={<HourglassBottomRoundedIcon />}
            />

            <MetricCard
              title="Vencidos"
              value={formatNumber(dashboard?.periodosVencidos)}
              subtitle="Periodos abiertos vencidos"
              icon={<WarningAmberRoundedIcon />}
            />

            <MetricCard
              title="Sin periodo abierto"
              value={formatNumber(dashboard?.empleadosSinPeriodoAbierto)}
              subtitle="Empleados activos por revisar"
              icon={<EventAvailableRoundedIcon />}
            />

            <MetricCard
              title="Uso acumulado"
              value={`${formatNumber(eficienciaUso)}%`}
              subtitle={`${formatDays(dashboard?.diasTomadosTotal)} tomados`}
              icon={<DashboardRoundedIcon />}
            />

            <MetricCard
              title="Movimientos del mes"
              value={formatNumber(dashboard?.movimientosMes)}
              subtitle="Actividad registrada"
              icon={<TimelineRoundedIcon />}
            />

            <MetricCard
              title="Legacy"
              value={formatNumber(dashboard?.movimientosImportacionLegacy)}
              subtitle="Movimientos desde Excel"
              icon={<UploadFileRoundedIcon />}
            />

            <MetricCard
              title="Rechazadas del mes"
              value={formatNumber(dashboard?.solicitudesRechazadasMes)}
              subtitle="Solicitudes no autorizadas"
              icon={<WarningAmberRoundedIcon />}
            />

            <MetricCard
              title="Canceladas del mes"
              value={formatNumber(dashboard?.solicitudesCanceladasMes)}
              subtitle="Canceladas antes de aprobar"
              icon={<CalendarMonthRoundedIcon />}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <SectionCard
              title="Solicitudes pendientes"
              subtitle="Vacaciones registradas que aún requieren aprobación."
              actions={
                <Chip
                  size="small"
                  color={(dashboard?.solicitudesPendientes ?? 0) > 0 ? "warning" : "default"}
                  variant="outlined"
                  label={`${formatNumber(dashboard?.solicitudesPendientes)} pendiente(s)`}
                />
              }
            >
              <SolicitudesTable
                mode="pendientes"
                items={dashboard?.solicitudesPendientesDetalle ?? []}
                emptyTitle="Sin solicitudes pendientes"
                emptyDescription="No hay vacaciones esperando aprobación."
              />
            </SectionCard>

            <SectionCard
              title="Próximas vacaciones aprobadas"
              subtitle="Solicitudes aprobadas con fechas próximas o vigentes."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<CalendarMonthRoundedIcon />}
                  label={`${dashboard?.proximasVacacionesAprobadas?.length ?? 0} próxima(s)`}
                />
              }
            >
              <SolicitudesTable
                mode="aprobadas"
                items={dashboard?.proximasVacacionesAprobadas ?? []}
                emptyTitle="Sin vacaciones aprobadas próximas"
                emptyDescription="No hay vacaciones aprobadas por iniciar o vigentes."
              />
            </SectionCard>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <SectionCard
              title="Top saldos disponibles"
              subtitle="Empleados con mayor saldo pendiente en periodos abiertos."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${formatDays(dashboard?.saldoTotal)} disponibles`}
                />
              }
            >
              <TopSaldosTable items={dashboard?.topSaldos ?? []} />
            </SectionCard>

            <SectionCard
              title="Próximos aniversarios"
              subtitle="Ciclos laborales que están por cumplirse."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<CalendarMonthRoundedIcon />}
                  label={`${dashboard?.proximosAniversarios?.length ?? 0} próximos`}
                />
              }
            >
              <AniversariosList items={dashboard?.proximosAniversarios ?? []} />
            </SectionCard>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <SectionCard
              title="Periodos por vencer"
              subtitle="Saldos con fecha límite de disfrute dentro de los próximos 30 días."
              actions={
                <Chip
                  size="small"
                  color={(dashboard?.periodosPorVencer30Dias ?? 0) > 0 ? "warning" : "default"}
                  variant="outlined"
                  label={`${formatNumber(dashboard?.periodosPorVencer30Dias)} alerta(s)`}
                />
              }
            >
              <PeriodosVencerTable items={dashboard?.periodosPorVencer ?? []} />
            </SectionCard>

            <SectionCard
              title="Últimos movimientos"
              subtitle="Actividad reciente de aperturas, disfrutes, ajustes e importaciones."
              actions={
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${formatNumber(dashboard?.movimientosMes)} este mes`}
                />
              }
            >
              <MovimientosTable items={dashboard?.ultimosMovimientos ?? []} />
            </SectionCard>
          </Box>

          <SectionCard
            title="Acciones rápidas"
            subtitle="Atajos operativos del módulo de vacaciones."
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="contained"
                component={RouterLink}
                to="/vacaciones/solicitudes"
                startIcon={<BeachAccessRoundedIcon />}
              >
                Solicitudes
              </Button>

              <Button
                size="small"
                variant="outlined"
                component={RouterLink}
                to="/vacaciones/reportes/saldos"
                startIcon={<SavingsRoundedIcon />}
              >
                Reporte de saldos
              </Button>

              <Button
                size="small"
                variant="outlined"
                component={RouterLink}
                to="/vacaciones/reportes/kardex"
                startIcon={<TimelineRoundedIcon />}
              >
                Reporte kárdex
              </Button>

              <Button
                size="small"
                variant="outlined"
                component={RouterLink}
                to="/vacaciones/conciliacion"
                startIcon={<WarningAmberRoundedIcon />}
              >
                Validar Excel
              </Button>

              <Button
                size="small"
                variant="outlined"
                component={RouterLink}
                to="/vacaciones/importacion"
                startIcon={<UploadFileRoundedIcon />}
              >
                Importar saldos
              </Button>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </AppPage>
  );
}