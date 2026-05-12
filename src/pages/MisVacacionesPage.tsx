import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
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
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  getEstatusVacacionPeriodoLabel,
  getMisVacacionesKardex,
  getMisVacacionesPeriodos,
  getMisVacacionesResumen,
  getTipoMovimientoVacacionLabel,
  type VacacionMovimiento,
  type VacacionPeriodo,
  type VacacionesResumen,
} from "../api/vacaciones.api";
import {
  getEstatusVacacionSolicitudLabel,
  getMisVacacionesSolicitudes,
  type VacacionesSolicitud,
  type VacacionesSolicitudListResult,
} from "../api/vacacionesSolicitudes.api";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";

type SectionKey = "resumen" | "solicitudes" | "kardex" | "periodos";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDays(value?: number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
  }).format(numberValue);
}

function getSolicitudColor(value?: string | number | null) {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "PENDIENTE" || raw === "1") return "warning" as const;
  if (raw === "APROBADA" || raw === "2") return "success" as const;
  if (raw === "RECHAZADA" || raw === "3") return "error" as const;
  if (raw === "CANCELADA" || raw === "4") return "default" as const;

  return "default" as const;
}

function getPeriodoColor(value?: string | number | null) {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "ABIERTO" || raw === "1") return "success" as const;
  if (raw === "CERRADO" || raw === "2") return "default" as const;
  if (raw === "VENCIDO" || raw === "3") return "warning" as const;

  return "default" as const;
}

function EmptyBox({
  title,
  message,
}: {
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
      <Typography fontWeight={900}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {message}
      </Typography>
    </Paper>
  );
}

function SideButton({
  active,
  icon,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      variant={active ? "contained" : "text"}
      startIcon={icon}
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        textAlign: "left",
        borderRadius: "14px",
        px: 1.6,
        py: 1.25,
        textTransform: "none",
        boxShadow: "none",
      }}
    >
      <Box>
        <Typography fontWeight={900} fontSize="0.9rem">
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: active ? alpha("#ffffff", 0.8) : "text.secondary",
            lineHeight: 1.25,
          }}
        >
          {helper}
        </Typography>
      </Box>
    </Button>
  );
}

function SolicitudesTable({ items }: { items: VacacionesSolicitud[] }) {
  if (items.length === 0) {
    return (
      <EmptyBox
        title="Sin solicitudes"
        message="Cuando registres solicitudes de vacaciones, aparecerán aquí."
      />
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Folio</TableCell>
            <TableCell>Periodo</TableCell>
            <TableCell align="right">Días</TableCell>
            <TableCell>Estatus</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ fontWeight: 800 }}>SOL-VAC-{item.id}</TableCell>
              <TableCell>
                {formatDate(item.fechaInicio)} - {formatDate(item.fechaFin)}
              </TableCell>
              <TableCell align="right">{formatDays(item.diasSolicitados)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={getSolicitudColor(item.estatus)}
                  label={item.estatusNombre || getEstatusVacacionSolicitudLabel(item.estatus)}
                  sx={{ fontWeight: 800 }}
                />
              </TableCell>
              <TableCell>{item.comentarioEmpleado || item.comentarioResolucion || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PeriodosTable({ items }: { items: VacacionPeriodo[] }) {
  if (items.length === 0) {
    return (
      <EmptyBox
        title="Sin periodos"
        message="Todavía no hay periodos de vacaciones registrados."
      />
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Año servicio</TableCell>
            <TableCell>Periodo</TableCell>
            <TableCell align="right">Derecho</TableCell>
            <TableCell align="right">Tomados</TableCell>
            <TableCell align="right">Saldo</TableCell>
            <TableCell>Estatus</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ fontWeight: 800 }}>
                Ciclo {item.cicloLaboral ?? 1} · Año {item.anioServicio}
              </TableCell>
              <TableCell>
                <Stack spacing={0.2}>
                  <Typography variant="body2">
                    {formatDate(item.fechaInicio)} - {formatDate(item.fechaFin)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Límite: {formatDate(item.fechaLimiteDisfrute)}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">{formatDays(item.diasDerecho)}</TableCell>
              <TableCell align="right">{formatDays(item.diasTomados)}</TableCell>
              <TableCell align="right">
                <Typography fontWeight={900} color={Number(item.saldo) > 0 ? "primary.main" : "text.secondary"}>
                  {formatDays(item.saldo)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={getPeriodoColor(item.estatus)}
                  label={getEstatusVacacionPeriodoLabel(item.estatus)}
                  sx={{ fontWeight: 800 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function KardexTable({ items }: { items: VacacionMovimiento[] }) {
  if (items.length === 0) {
    return (
      <EmptyBox
        title="Sin movimientos"
        message="Todavía no hay movimientos registrados en tu kárdex."
      />
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Movimiento</TableCell>
            <TableCell align="right">Días</TableCell>
            <TableCell>Saldo</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{formatDateTime(item.fechaMovimiento)}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>
                {getTipoMovimientoVacacionLabel(item.tipoMovimiento)}
              </TableCell>
              <TableCell align="right">{formatDays(item.dias)}</TableCell>
              <TableCell>
                {formatDays(item.saldoAntes)} → {formatDays(item.saldoDespues)}
              </TableCell>
              <TableCell>{item.comentario || item.referencia || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MisVacacionesPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("resumen");

  const [resumen, setResumen] = useState<VacacionesResumen | null>(null);
  const [periodos, setPeriodos] = useState<VacacionPeriodo[]>([]);
  const [kardex, setKardex] = useState<VacacionMovimiento[]>([]);
  const [solicitudes, setSolicitudes] =
    useState<VacacionesSolicitudListResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);

      const [resumenData, periodosData, kardexData, solicitudesData] =
        await Promise.all([
          getMisVacacionesResumen(),
          getMisVacacionesPeriodos(),
          getMisVacacionesKardex(),
          getMisVacacionesSolicitudes({ page: 1, pageSize: 8 }),
        ]);

      setResumen(resumenData);
      setPeriodos(periodosData);
      setKardex(kardexData);
      setSolicitudes(solicitudesData);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar tu información de vacaciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const latestKardex = useMemo(() => kardex.slice(0, 8), [kardex]);
  const latestSolicitudes = solicitudes?.items ?? [];

  if (loading) {
    return (
      <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Cargando tus vacaciones...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={2.25} sx={{ pt: { xs: 0.5, md: 1 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: "22px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
          background:
            "linear-gradient(135deg, #071733 0%, #0f2b5c 58%, #173b78 100%)",
          color: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 2.7 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: alpha("#ffffff", 0.72), fontWeight: 900, letterSpacing: 1.1 }}
              >
                Mis vacaciones
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 950, letterSpacing: "-0.04em", lineHeight: 1.08 }}
              >
                Resumen personal de vacaciones
              </Typography>

              <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84), mt: 0.8 }}>
                Consulta saldo, solicitudes, periodos y movimientos de tu kárdex.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshRoundedIcon />}
              onClick={() => void loadData(true)}
              disabled={refreshing}
              sx={{
                bgcolor: "#ffffff",
                color: "primary.main",
                borderRadius: "10px",
                boxShadow: "none",
                "&:hover": { bgcolor: alpha("#ffffff", 0.92), boxShadow: "none" },
              }}
            >
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "260px minmax(0, 1fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            borderRadius: "18px",
            border: "1px solid",
            borderColor: "divider",
            position: { lg: "sticky" },
            top: { lg: 88 },
          }}
        >
          <Stack spacing={0.7}>
            <SideButton
              active={activeSection === "resumen"}
              icon={<BeachAccessRoundedIcon />}
              label="Resumen"
              helper="Saldo y datos clave"
              onClick={() => setActiveSection("resumen")}
            />

            <SideButton
              active={activeSection === "solicitudes"}
              icon={<AssignmentTurnedInRoundedIcon />}
              label="Solicitudes"
              helper="Historial reciente"
              onClick={() => setActiveSection("solicitudes")}
            />

            <SideButton
              active={activeSection === "kardex"}
              icon={<TimelineRoundedIcon />}
              label="Kárdex"
              helper="Movimientos y saldo"
              onClick={() => setActiveSection("kardex")}
            />

            <SideButton
              active={activeSection === "periodos"}
              icon={<EventAvailableRoundedIcon />}
              label="Periodos"
              helper="Derecho y vencimientos"
              onClick={() => setActiveSection("periodos")}
            />
          </Stack>

          <Divider sx={{ my: 1.2 }} />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={() => setActiveSection("solicitudes")}
            sx={{ borderRadius: "12px", fontWeight: 850 }}
          >
            Ver solicitudes
          </Button>
        </Paper>

        <Stack spacing={2}>
          {activeSection === "resumen" ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                <MetricCard
                  title="Saldo disponible"
                  value={Number(resumen?.saldoDisponible ?? 0)}
                  subtitle="Días pendientes de disfrutar"
                  icon={<BeachAccessRoundedIcon fontSize="small" />}
                />

                <MetricCard
                  title="Días tomados"
                  value={Number(resumen?.diasTomadosTotal ?? 0)}
                  subtitle="Histórico disfrutado"
                  icon={<TaskAltRoundedIcon fontSize="small" />}
                />

                <MetricCard
                  title="Solicitudes pendientes"
                  value={solicitudes?.pendientes ?? 0}
                  subtitle="En revisión"
                  icon={<PendingActionsRoundedIcon fontSize="small" />}
                />
              </Box>

              <SectionCard
                title="Datos del ciclo"
                subtitle="Información vigente de tu política y próximo aniversario."
              >
                {resumen ? (
                  <Stack spacing={1.25}>
                    <Alert severity="info" sx={{ borderRadius: "14px" }}>
                      Próximo aniversario: <strong>{formatDate(resumen.proximoAniversario)}</strong>
                      {resumen.politicaNombre ? ` · Política: ${resumen.politicaNombre}` : ""}
                    </Alert>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(3, 1fr)",
                        },
                        gap: 1.25,
                      }}
                    >
                      <Paper variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                        <Typography variant="caption" color="text.secondary">Antigüedad</Typography>
                        <Typography fontWeight={900}>{resumen.antiguedadAnios ?? 0} año(s)</Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                        <Typography variant="caption" color="text.secondary">Prima vacacional</Typography>
                        <Typography fontWeight={900}>{formatDays(resumen.primaVacacionalPorcentaje)}%</Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                        <Typography variant="caption" color="text.secondary">Periodos abiertos</Typography>
                        <Typography fontWeight={900}>{resumen.periodosAbiertos ?? 0}</Typography>
                      </Paper>
                    </Box>
                  </Stack>
                ) : (
                  <EmptyBox title="Sin resumen" message="No hay información de vacaciones disponible." />
                )}
              </SectionCard>
            </>
          ) : null}

          {activeSection === "solicitudes" ? (
            <SectionCard
              title="Solicitudes"
              subtitle="Historial reciente de tus solicitudes de vacaciones."
              actions={
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => window.location.assign("/vacaciones/solicitudes")}
                  sx={{ borderRadius: "10px", fontWeight: 850 }}
                >
                  Nueva solicitud
                </Button>
              }
            >
              <SolicitudesTable items={latestSolicitudes} />
            </SectionCard>
          ) : null}

          {activeSection === "kardex" ? (
            <SectionCard
              title="Kárdex"
              subtitle="Movimientos de vacaciones y evolución de saldo."
            >
              <KardexTable items={latestKardex} />
            </SectionCard>
          ) : null}

          {activeSection === "periodos" ? (
            <SectionCard
              title="Periodos"
              subtitle="Derechos generados, saldo y vencimientos."
            >
              <PeriodosTable items={periodos} />
            </SectionCard>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}
