import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { alpha, useTheme } from "@mui/material/styles";

import {
  getReclutamientoDashboard,
  type DashboardAlerta,
  type DashboardCountItem,
  type DashboardVacanteResumen,
  type DashboardCandidatoResumen,
} from "../api/reclutamientoDashboard.api";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import ActionTile from "../components/ui/ActionTile";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeLabel(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function getEtapaTone(
  etapa: string
): "default" | "success" | "info" | "warning" | "error" {
  const value = normalizeLabel(etapa);

  if (["CONTRATADO"].includes(value)) return "success";
  if (["OFERTA", "ENTREVISTA", "EVALUACION", "EVALUACIÓN"].includes(value)) {
    return "info";
  }
  if (["DESCARTADO", "RECHAZADO"].includes(value)) return "error";
  if (["POSTULADO", "FILTRO_RH"].includes(value)) return "warning";

  return "default";
}

function getVacanteStatusTone(
  estatus: string
): "default" | "success" | "info" | "warning" | "error" {
  const value = normalizeLabel(estatus);

  if (["ACTIVA", "ABIERTA", "PUBLICADA"].includes(value)) return "success";
  if (["PAUSADA"].includes(value)) return "warning";
  if (["CERRADA", "CERRADO", "FINALIZADA", "CUBIERTA"].includes(value)) {
    return "default";
  }

  return "info";
}

function getAlertSeverity(
  tipo: string
): "success" | "info" | "warning" | "error" {
  const value = normalizeLabel(tipo);

  if (value === "SUCCESS") return "success";
  if (value === "INFO") return "info";
  if (value === "WARNING") return "warning";
  if (value === "ERROR") return "error";

  return "info";
}

function ClickableMetricCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "block",
        textAlign: "inherit",
        borderRadius: "22px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          transition: "transform 140ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MetricCard
          title={title}
          value={value}
          icon={icon}
          subtitle={subtitle}
        />
      </Box>
    </ButtonBase>
  );
}

function PipelineList({ items }: { items: DashboardCountItem[] }) {
  const theme = useTheme();
  const max = Math.max(...items.map((x) => x.total), 1);

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aún no hay etapas registradas.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {items.map((item) => {
        const percent = Math.max((item.total / max) * 100, 8);

        return (
          <Box key={item.nombre}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.6 }}
            >
              <Typography fontWeight={700} variant="body2">
                {item.nombre}
              </Typography>
              <Chip
                size="small"
                label={item.total}
                color={getEtapaTone(item.nombre)}
                variant="outlined"
              />
            </Stack>

            <Box
              sx={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                backgroundColor: alpha(theme.palette.text.primary, 0.08),
              }}
            >
              <Box
                sx={{
                  width: `${percent}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${alpha(
                    theme.palette.primary.main,
                    0.9
                  )} 0%, ${alpha(theme.palette.primary.main, 0.45)} 100%)`,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function VacantesTopList({
  items,
  onOpenVacante,
}: {
  items: DashboardVacanteResumen[];
  onOpenVacante: (id: number) => void;
}) {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay vacantes con postulaciones todavía.
      </Typography>
    );
  }

  return (
    <List disablePadding sx={{ display: "grid", gap: 1.1 }}>
      {items.map((item, index) => (
        <ListItem key={item.id} disableGutters sx={{ px: 0, py: 0 }}>
          <ButtonBase
            onClick={() => onOpenVacante(item.id)}
            sx={{
              width: "100%",
              textAlign: "left",
              borderRadius: "18px",
              p: 1.2,
              justifyContent: "flex-start",
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              transition:
                "transform 140ms ease, background-color 140ms ease, border-color 140ms ease",
              "&:hover": {
                transform: "translateY(-1px)",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="flex-start"
              sx={{ width: "100%" }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 13,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ mb: 0.5 }}
                >
                  <Typography fontWeight={800}>{item.titulo}</Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.estatus}
                    color={getVacanteStatusTone(item.estatus)}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {item.departamento || "Sin departamento"} •{" "}
                  {item.sucursal || "Sin sucursal"}
                </Typography>
              </Box>

              <Stack alignItems="flex-end" spacing={0.8}>
                <Chip
                  size="small"
                  label={`${item.totalCandidatos} candidatos`}
                  color="primary"
                  variant="filled"
                />
                <OpenInNewRoundedIcon
                  sx={{ fontSize: 18, color: "text.secondary" }}
                />
              </Stack>
            </Stack>
          </ButtonBase>
        </ListItem>
      ))}
    </List>
  );
}

function CandidatosRecientesList({
  items,
  onOpenCandidatos,
}: {
  items: DashboardCandidatoResumen[];
  onOpenCandidatos: () => void;
}) {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay candidatos recientes para mostrar.
      </Typography>
    );
  }

  return (
    <List disablePadding sx={{ display: "grid", gap: 1.1 }}>
      {items.map((item) => (
        <ListItem
          key={`${item.id}-${item.fechaRegistroUtc}`}
          disableGutters
          sx={{ px: 0, py: 0 }}
        >
          <ButtonBase
            onClick={onOpenCandidatos}
            sx={{
              width: "100%",
              textAlign: "left",
              borderRadius: "18px",
              p: 1.2,
              justifyContent: "flex-start",
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              transition:
                "transform 140ms ease, background-color 140ms ease, border-color 140ms ease",
              "&:hover": {
                transform: "translateY(-1px)",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
                sx={{ mb: 0.6 }}
              >
                <Typography fontWeight={800}>{item.nombreCompleto}</Typography>
                <Chip
                  size="small"
                  label={item.etapa}
                  color={getEtapaTone(item.etapa)}
                  variant="outlined"
                />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {item.vacante || "Sin vacante"}
              </Typography>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mt: 0.7 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Registrado: {formatDate(item.fechaRegistroUtc)}
                </Typography>
                <OpenInNewRoundedIcon
                  sx={{ fontSize: 18, color: "text.secondary" }}
                />
              </Stack>
            </Box>
          </ButtonBase>
        </ListItem>
      ))}
    </List>
  );
}

function AlertasList({ items }: { items: DashboardAlerta[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay alertas por ahora.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.1}>
      {items.map((item, index) => (
        <Alert
          key={`${item.titulo}-${index}`}
          severity={getAlertSeverity(item.tipo)}
          variant="outlined"
        >
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>
              {item.titulo}
              {typeof item.total === "number" ? ` (${item.total})` : ""}
            </Typography>
            {item.descripcion ? (
              <Typography variant="body2">{item.descripcion}</Typography>
            ) : null}
          </Stack>
        </Alert>
      ))}
    </Stack>
  );
}

export default function ReclutamientoDashboardPage() {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["reclutamiento-dashboard"],
    queryFn: getReclutamientoDashboard,
  });

  const heroChips = useMemo(() => {
    if (!query.data) return [];

    return [
      `${query.data.vacantesActivas} vacantes activas`,
      `${query.data.candidatosEnProceso} candidatos en proceso`,
      `${query.data.contratadosMes} contratados del mes`,
    ];
  }, [query.data]);

  const goToVacantes = () => navigate("/reclutamiento/vacantes");
  const goToCandidatos = () => navigate("/reclutamiento/candidatos");
  const goToVacanteDetail = (id: number) =>
    navigate(`/reclutamiento/vacantes/${id}`);

  return (
    <AppPage title="" subtitle="">
      <Stack spacing={3}>
        <HeroBanner
          eyebrow="Pipeline, vacantes y cierre"
          title="Pulso comercial del talento"
          subtitle="Revisa cómo va la atracción, selección y cierre de vacantes sin entrar módulo por módulo como arqueólogo del sistema."
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={goToVacantes}
              >
                Nueva vacante
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonSearchRoundedIcon />}
                onClick={goToCandidatos}
              >
                Ver candidatos
              </Button>
            </Stack>
          }
        />

        {heroChips.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: -1 }}
          >
            {heroChips.map((chip) => (
              <Chip key={chip} label={chip} color="primary" variant="outlined" />
            ))}
          </Stack>
        ) : null}

        {query.isLoading ? (
          <SectionCard title="Cargando dashboard">
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              justifyContent="center"
              sx={{ py: 5 }}
            >
              <CircularProgress size={24} />
              <Typography color="text.secondary">
                Cargando información de reclutamiento...
              </Typography>
            </Stack>
          </SectionCard>
        ) : query.isError ? (
          <SectionCard title="No se pudo cargar el dashboard">
            <Alert severity="error" variant="outlined">
              Ocurrió un problema al consultar el dashboard de reclutamiento.
            </Alert>
          </SectionCard>
        ) : query.data ? (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <ClickableMetricCard
                title="Vacantes activas"
                value={query.data.vacantesActivas}
                icon={<WorkOutlineRoundedIcon />}
                subtitle="Posiciones abiertas"
                onClick={goToVacantes}
              />
              <ClickableMetricCard
                title="Vacantes cerradas"
                value={query.data.vacantesCerradas}
                icon={<TaskAltRoundedIcon />}
                subtitle="Vacantes finalizadas"
                onClick={goToVacantes}
              />
              <ClickableMetricCard
                title="Candidatos totales"
                value={query.data.candidatosTotales}
                icon={<Groups2RoundedIcon />}
                subtitle="Banco de talento"
                onClick={goToCandidatos}
              />
              <ClickableMetricCard
                title="En proceso"
                value={query.data.candidatosEnProceso}
                icon={<TimelineRoundedIcon />}
                subtitle="Postulaciones activas"
                onClick={goToCandidatos}
              />
              <ClickableMetricCard
                title="Contratados del mes"
                value={query.data.contratadosMes}
                icon={<AssignmentTurnedInRoundedIcon />}
                subtitle="Cierres del periodo"
                onClick={goToCandidatos}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1.1fr 1fr" },
                gap: 2,
              }}
            >
              <SectionCard
                title="Pipeline por etapa"
                subtitle="Concentrado de postulaciones por fase actual."
              >
                <PipelineList items={query.data.pipelinePorEtapa} />
              </SectionCard>

              <SectionCard
                title="Vacantes con más candidatos"
                subtitle="Haz clic en una vacante para abrir su detalle."
              >
                <VacantesTopList
                  items={query.data.vacantesTop}
                  onOpenVacante={goToVacanteDetail}
                />
              </SectionCard>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                gap: 2,
              }}
            >
              <SectionCard
                title="Candidatos recientes"
                subtitle="Haz clic en un registro para ir al listado de candidatos."
              >
                <CandidatosRecientesList
                  items={query.data.candidatosRecientes}
                  onOpenCandidatos={goToCandidatos}
                />
              </SectionCard>

              <SectionCard
                title="Alertas y pendientes"
                subtitle="Puntos que RH debería revisar antes de que se empolven."
              >
                <AlertasList items={query.data.alertas} />
              </SectionCard>
            </Box>

            <SectionCard
              title="Accesos rápidos"
              subtitle="Atajos del módulo para operar sin dar vueltas."
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <ActionTile
                  title="Vacantes"
                  subtitle="Revisar y administrar posiciones abiertas"
                  icon={<WorkOutlineRoundedIcon />}
                  onClick={goToVacantes}
                />
                <ActionTile
                  title="Candidatos"
                  subtitle="Consultar banco de talento y perfiles"
                  icon={<PersonSearchRoundedIcon />}
                  onClick={goToCandidatos}
                />
                <ActionTile
                  title="Nueva vacante"
                  subtitle="Ir al módulo para crear una nueva posición"
                  icon={<AddRoundedIcon />}
                  onClick={goToVacantes}
                />
                <ActionTile
                  title="Seguimiento"
                  subtitle="Dar continuidad al proceso de selección"
                  icon={<SearchRoundedIcon />}
                  onClick={goToCandidatos}
                />
              </Box>

              <Divider sx={{ my: 2.25 }} />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Desde aquí ya puedes entrar al módulo correcto sin andar brincando como chapulín entre pantallas.
                </Typography>

                <Button
                  variant="text"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={goToVacantes}
                >
                  Ir a Vacantes
                </Button>
              </Stack>
            </SectionCard>
          </>
        ) : null}
      </Stack>
    </AppPage>
  );
}