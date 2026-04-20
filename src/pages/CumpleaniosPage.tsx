import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
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
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";

import {
  getCumpleaniosHoy,
  getCumpleaniosMes,
  getCumpleaniosProximos,
  getCumpleaniosResumen,
  type CumpleaniosItem,
} from "../api/cumpleanios.api";
import { getSucursales, type SucursalListItem } from "../api/sucursales.api";
import {
  getDepartamentos,
  type DepartamentoListItem,
} from "../api/departamentos.api";

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
          {item.puestoNombre || "Sin puesto"} · {item.sucursalNombre || "Sin sucursal"}
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
  const [sucursalId, setSucursalId] = useState<number | "">("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [mesActual] = useState<number>(today.getMonth() + 1);
  const [anioActual] = useState<number>(today.getFullYear());

  const filtros = useMemo(
    () => ({
      sucursalId: sucursalId === "" ? null : sucursalId,
      departamentoId: departamentoId === "" ? null : departamentoId,
    }),
    [sucursalId, departamentoId]
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

  const resumen = resumenQuery.data;
  const hoy = hoyQuery.data ?? [];
  const proximos = proximosQuery.data ?? [];
  const delMes = mesQuery.data ?? [];

  return (
    <AppPage>
      <HeroBanner
        title="Cumpleaños"
        subtitle="Consulta celebraciones del día, próximos cumpleaños y calendario del mes por sucursal o departamento."
        eyebrow="Capital humano"
        icon={<CelebrationRoundedIcon />}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Hoy"
            value={resumen?.hoy ?? 0}
            subtitle="Cumpleaños del día"
            icon={<TodayRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <MetricCard
            title="Próximos 7 días"
            value={resumen?.proximos7Dias ?? 0}
            subtitle="Celebraciones cercanas"
            icon={<EventRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <MetricCard
            title="Este mes"
            value={resumen?.esteMes ?? 0}
            subtitle={`Cumpleaños de ${getMesNombre(mesActual)}`}
            icon={<CalendarMonthRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12}>
          <SectionCard
            title="Filtros"
            subtitle="Acota la vista por estructura organizacional."
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Sucursal"
                  value={sucursalId}
                  onChange={(e) =>
                    setSucursalId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <MenuItem value="">Todas</MenuItem>
                  {(sucursalesQuery.data as SucursalListItem[] | undefined)?.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
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
                >
                  <MenuItem value="">Todos</MenuItem>
                  {(departamentosQuery.data as DepartamentoListItem[] | undefined)?.map(
                    (item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nombre}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {isLoading ? (
          <Grid item xs={12}>
            <SectionCard title="Cargando" subtitle="Preparando información de cumpleaños.">
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            </SectionCard>
          </Grid>
        ) : null}

        {hasError ? (
          <Grid item xs={12}>
            <Alert severity="error">
              No se pudo cargar el módulo de cumpleaños. Revisa la API o los permisos.
            </Alert>
          </Grid>
        ) : null}

        {!isLoading && !hasError ? (
          <>
            <Grid item xs={12} md={5}>
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

            <Grid item xs={12} md={7}>
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
                      <BirthdayPersonCard key={`proximo-${item.empleadoId}`} item={item} />
                    ))}
                  </Stack>
                )}
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
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
                      <Grid item xs={12} md={6} lg={4} key={`mes-${item.empleadoId}`}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            height: "100%",
                          }}
                        >
                          <Avatar
                            src={item.fotoUrl ?? undefined}
                            sx={{ width: 44, height: 44 }}
                          >
                            {item.fotoUrl ? null : <PersonRoundedIcon />}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap>
                              {item.nombreCompleto}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" noWrap>
                              {formatFechaDiaMes(item)} · {item.edadQueCumple} años
                            </Typography>

                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.sucursalNombre || "Sin sucursal"}
                            </Typography>
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
    </AppPage>
  );
}