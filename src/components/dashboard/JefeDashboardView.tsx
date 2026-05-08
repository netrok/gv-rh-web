import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";

import { getIncidencias } from "../../api/incidencias.api";
import { getMiEquipo } from "../../api/miEquipo.api";
import { getVacacionesSolicitudes } from "../../api/vacacionesSolicitudes.api";

type AnyRecord = Record<string, any>;

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  tone?: "primary" | "success" | "warning" | "info";
};

const GV_NAVY = "#071832";
const GV_BLUE = "#0b2e63";

function getValue<T = unknown>(
  record: AnyRecord | null | undefined,
  keys: string[],
  fallback: T
): T {
  if (!record) return fallback;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }

  return fallback;
}

function getText(
  record: AnyRecord | null | undefined,
  keys: string[],
  fallback = "Sin dato"
): string {
  const value = getValue<string | number | null | undefined>(
    record,
    keys,
    fallback
  );

  return String(value ?? fallback).trim() || fallback;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getDateRange(item: AnyRecord) {
  const start = formatDate(
    getValue<string | null>(item, ["fechaInicio", "FechaInicio"], null)
  );
  const end = formatDate(
    getValue<string | null>(item, ["fechaFin", "FechaFin"], null)
  );

  if (start && end && start !== end) return `${start} - ${end}`;
  return start || end || "Sin fecha";
}

function normalizeList(payload: any): AnyRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.Items)) return payload.Items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone = "primary",
}: MetricCardProps) {
  const theme = useTheme();

  const color =
    tone === "success"
      ? theme.palette.success.main
      : tone === "warning"
        ? theme.palette.warning.main
        : tone === "info"
          ? theme.palette.info.main
          : theme.palette.primary.main;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 1,
        border: `1px solid ${alpha(color, 0.22)}`,
        borderTop: `4px solid ${color}`,
        bgcolor: "background.paper",
        boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.06)}`,
      }}
    >
      <CardContent sx={{ p: 1.8 }}>
        <Stack direction="row" spacing={1.4} alignItems="center">
          <Avatar
            sx={{
              width: 32,
                              height: 32,
              color,
              bgcolor: alpha(color, 0.12),
              borderRadius: 1.1,
            }}
          >
            {icon}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
              {label}
            </Typography>

            <Typography variant="h5" fontWeight={950} lineHeight={1.05}>
              {value}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

function AccessCard({
  icon,
  title,
  description,
  to,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
}) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
        height: "100%",
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: `0 8px 22px ${alpha(theme.palette.common.black, 0.045)}`,
      }}
    >
      <CardActionArea onClick={() => navigate(to)} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 1.7 }}>
          <Stack direction="row" spacing={1.3} alignItems="flex-start">
            <Avatar
              sx={{
                width: 32,
                              height: 32,
                borderRadius: 1.1,
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.11),
              }}
            >
              {icon}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography fontWeight={950}>{title}</Typography>
                <ArrowForwardRoundedIcon fontSize="small" color="action" />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box
      sx={{
        py: 2.8,
        px: 2,
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
        bgcolor: "background.default",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}

export default function JefeDashboardView() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipo, setEquipo] = useState<AnyRecord | null>(null);
  const [incidencias, setIncidencias] = useState<AnyRecord[]>([]);
  const [solicitudes, setSolicitudes] = useState<AnyRecord[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const errors: string[] = [];

      const [equipoResult, incidenciasResult, solicitudesResult] =
        await Promise.allSettled([
          getMiEquipo(),
          getIncidencias({ soloPendientes: true } as any),
          getVacacionesSolicitudes({
            estatus: "PENDIENTE",
            page: 1,
            pageSize: 8,
          } as any),
        ]);

      if (!active) return;

      if (equipoResult.status === "fulfilled") {
        setEquipo(equipoResult.value as AnyRecord);
      } else {
        errors.push("No se pudo cargar Mi equipo.");
      }

      if (incidenciasResult.status === "fulfilled") {
        setIncidencias(normalizeList(incidenciasResult.value));
      } else {
        errors.push("No se pudieron cargar las incidencias pendientes.");
      }

      if (solicitudesResult.status === "fulfilled") {
        setSolicitudes(normalizeList(solicitudesResult.value));
      } else {
        errors.push("No se pudieron cargar las solicitudes de vacaciones.");
      }

      setError(errors.length ? errors.join(" ") : null);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const equipoItems = useMemo(() => normalizeList(equipo?.empleados), [equipo]);

  const incidenciasPendientes = useMemo(
    () =>
      incidencias
        .filter(
          (item) =>
            getText(item, ["estatus", "Estatus"], "PENDIENTE").toUpperCase() ===
            "PENDIENTE"
        )
        .slice(0, 5),
    [incidencias]
  );

  const solicitudesPendientes = useMemo(
    () =>
      solicitudes
        .filter(
          (item) =>
            getText(item, ["estatus", "Estatus"], "PENDIENTE").toUpperCase() ===
            "PENDIENTE"
        )
        .slice(0, 5),
    [solicitudes]
  );

  const jefeNombre = getText(equipo, ["jefeNombre", "JefeNombre"], "Jefatura");

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 360 }}>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Cargando dashboard de equipo...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 1.1,
          border: `1px solid ${alpha(theme.palette.primary.light, 0.22)}`,
          color: "common.white",
          background: `linear-gradient(135deg, ${GV_NAVY} 0%, ${GV_BLUE} 52%, #123a73 100%)`,
          boxShadow: `0 18px 45px ${alpha(theme.palette.primary.dark, 0.24)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Chip
                icon={<SupervisorAccountRoundedIcon />}
                label="Vista JEFE"
                variant="outlined"
                sx={{
                  fontWeight: 950,
                  mb: 1,
                  color: "common.white",
                  borderColor: alpha(theme.palette.common.white, 0.36),
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  "& .MuiChip-icon": {
                    color: "common.white",
                  },
                }}
              />

              <Typography variant="h4" fontWeight={950}>
                Dashboard de mi equipo
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  maxWidth: 800,
                  color: alpha(theme.palette.common.white, 0.82),
                }}
              >
                Resumen operativo de colaboradores bajo responsabilidad de {jefeNombre}.
                Información limitada al equipo asignado, sin datos globales del sistema.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<Groups2RoundedIcon />}
                label={`${formatNumber(equipoItems.length)} colaboradores`}
                sx={{
                  fontWeight: 900,
                  color: "common.white",
                  bgcolor: alpha(theme.palette.common.white, 0.13),
                  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
                  "& .MuiChip-icon": { color: "common.white" },
                }}
              />
              <Chip
                icon={<EventBusyRoundedIcon />}
                label={`${formatNumber(incidenciasPendientes.length)} incidencias pendientes`}
                sx={{
                  fontWeight: 900,
                  color: "common.white",
                  bgcolor: alpha(theme.palette.common.white, 0.13),
                  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
                  "& .MuiChip-icon": { color: "common.white" },
                }}
              />
              <Chip
                icon={<AssignmentTurnedInRoundedIcon />}
                label={`${formatNumber(solicitudesPendientes.length)} solicitudes pendientes`}
                sx={{
                  fontWeight: 900,
                  color: "common.white",
                  bgcolor: alpha(theme.palette.common.white, 0.13),
                  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
                  "& .MuiChip-icon": { color: "common.white" },
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="warning">{error}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.4,
        }}
      >
        <MetricCard
          icon={<PeopleAltRoundedIcon />}
          label="Mi equipo"
          value={formatNumber(equipoItems.length)}
          subtitle="Colaboradores asignados por aprobador primario o secundario."
          tone="primary"
        />
        <MetricCard
          icon={<EventBusyRoundedIcon />}
          label="Incidencias pendientes"
          value={formatNumber(incidenciasPendientes.length)}
          subtitle="Pendientes de seguimiento dentro de tu alcance."
          tone="warning"
        />
        <MetricCard
          icon={<AssignmentTurnedInRoundedIcon />}
          label="Solicitudes vacaciones"
          value={formatNumber(solicitudesPendientes.length)}
          subtitle="Solicitudes pendientes de revisión del equipo."
          tone="success"
        />
        <MetricCard
          icon={<CelebrationRoundedIcon />}
          label="Cumpleaños"
          value="Ver"
          subtitle="Consulta próximos cumpleaños del equipo."
          tone="info"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.2,
        }}
      >
        <AccessCard
          icon={<PeopleAltRoundedIcon />}
          title="Mi equipo"
          description="Consultar colaboradores bajo tu responsabilidad."
          to="/mi-equipo"
        />
        <AccessCard
          icon={<EventBusyRoundedIcon />}
          title="Incidencias"
          description="Registrar y dar seguimiento a incidencias del equipo."
          to="/incidencias"
        />
        <AccessCard
          icon={<AssignmentTurnedInRoundedIcon />}
          title="Solicitudes vacaciones"
          description="Revisar solicitudes pendientes de tu equipo."
          to="/vacaciones/solicitudes"
        />
        <AccessCard
          icon={<CelebrationRoundedIcon />}
          title="Cumpleaños"
          description="Ver cumpleaños próximos del personal."
          to="/cumpleanios"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.1fr 1fr",
          },
          gap: 1.4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.05)}`,
          }}
        >
          <CardContent sx={{ p: 1.8 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={950}>
                  Colaboradores de mi equipo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vista rápida del alcance operativo.
                </Typography>
              </Box>
              <Chip
                label={formatNumber(equipoItems.length)}
                size="small"
                sx={{ fontWeight: 900 }}
              />
            </Stack>

            <Divider sx={{ my: 1.4 }} />

            {equipoItems.length === 0 ? (
              <EmptyState text="No hay colaboradores asignados a este jefe." />
            ) : (
              <Stack spacing={0.8}>
                {equipoItems.slice(0, 6).map((item) => {
                  const id = getValue<string | number>(
                    item,
                    ["id", "empleadoId", "EmpleadoId"],
                    ""
                  );
                  const nombre = getText(
                    item,
                    ["nombreCompleto", "empleadoNombre", "EmpleadoNombre", "nombre"],
                    "Sin nombre"
                  );

                  return (
                    <Card
                      key={`equipo-${id || nombre}`}
                      elevation={0}
                      sx={{
                        borderRadius: 1.1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                      }}
                    >
                      <CardContent sx={{ p: 1.2, "&:last-child": { pb: 1.2 } }}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.1,
                              bgcolor: alpha(theme.palette.primary.main, 0.14),
                              color: "primary.main",
                              fontWeight: 950,
                            }}
                          >
                            {nombre.slice(0, 1).toUpperCase()}
                          </Avatar>

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={900} noWrap>
                              {nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {getText(item, ["numEmpleado", "NumEmpleado"], "Sin número")} ·{" "}
                              {getText(item, ["puestoNombre", "PuestoNombre"], "Sin puesto")}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={getText(
                              item,
                              ["tipoAprobador", "TipoAprobador", "relacion", "Relacion"],
                              "Equipo"
                            )}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Stack spacing={1.4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.05)}`,
            }}
          >
            <CardContent sx={{ p: 1.8 }}>
              <Typography variant="h6" fontWeight={950}>
                Incidencias pendientes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Últimos registros pendientes del equipo.
              </Typography>

              <Divider sx={{ my: 1.4 }} />

              {incidenciasPendientes.length === 0 ? (
                <EmptyState text="No hay incidencias pendientes." />
              ) : (
                <Stack spacing={1}>
                  {incidenciasPendientes.map((item) => (
                    <Box key={`inc-${getValue(item, ["id", "Id"], Math.random())}`}>
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>
                            {getText(
                              item,
                              ["empleadoNombre", "EmpleadoNombre", "empleadoNombreCompleto"],
                              "Empleado"
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getText(item, ["tipo", "Tipo"], "Incidencia")} · {getDateRange(item)}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label="Pendiente"
                          color="warning"
                          sx={{ fontWeight: 900 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.05)}`,
            }}
          >
            <CardContent sx={{ p: 1.8 }}>
              <Typography variant="h6" fontWeight={950}>
                Solicitudes de vacaciones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes de revisión del equipo.
              </Typography>

              <Divider sx={{ my: 1.4 }} />

              {solicitudesPendientes.length === 0 ? (
                <EmptyState text="No hay solicitudes de vacaciones pendientes." />
              ) : (
                <Stack spacing={1}>
                  {solicitudesPendientes.map((item) => (
                    <Box key={`sol-${getValue(item, ["id", "Id"], Math.random())}`}>
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>
                            {getText(
                              item,
                              ["empleadoNombre", "EmpleadoNombre", "empleadoNombreCompleto"],
                              "Empleado"
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getDateRange(item)}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label="Pendiente"
                          color="success"
                          sx={{ fontWeight: 900 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}


