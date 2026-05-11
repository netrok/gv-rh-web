import type { ReactNode } from "react";
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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlaylistAddCheckCircleIcon from "@mui/icons-material/PlaylistAddCheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getMisAprobaciones,
  type MisAprobacionesItem,
} from "../api/aprobaciones.api";

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

function normalize(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function formatLabel(value?: string | null) {
  const raw = (value ?? "").trim();

  if (!raw) return "—";

  return raw
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function getTipoConfig(tipo: string) {
  const key = normalize(tipo);

  if (key === "VACACIONES") {
    return {
      label: "Vacaciones",
      icon: <BeachAccessIcon fontSize="small" />,
      color: "info" as const,
      route: "/vacaciones/solicitudes",
    };
  }

  return {
    label: "Incidencia",
    icon: <AssignmentTurnedInIcon fontSize="small" />,
    color: "warning" as const,
    route: "/incidencias",
  };
}

function getStatusColor(estatus: string) {
  const key = normalize(estatus);

  if (key === "PENDIENTE") return "warning" as const;
  if (key === "APROBADA") return "success" as const;
  if (key === "RECHAZADA") return "error" as const;

  return "default" as const;
}

function MetricCard({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: number;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "action.hover",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        borderRadius: 2,
        textAlign: "center",
        bgcolor: "background.default",
      }}
    >
      <PlaylistAddCheckCircleIcon
        sx={{ fontSize: 48, color: "success.main", mb: 1 }}
      />

      <Typography variant="h6" fontWeight={800}>
        No hay aprobaciones pendientes
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Todo está en orden. Así da gusto abrir el sistema.
      </Typography>
    </Paper>
  );
}

function AprobacionRow({ item }: { item: MisAprobacionesItem }) {
  const navigate = useNavigate();
  const tipo = getTipoConfig(item.tipo);

  return (
    <TableRow hover>
      <TableCell>
        <Chip
          size="small"
          icon={tipo.icon}
          color={tipo.color}
          label={tipo.label}
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </TableCell>

      <TableCell>
        <Stack spacing={0.25}>
          <Typography fontWeight={800}>{item.empleadoNombre}</Typography>
          <Typography variant="caption" color="text.secondary">
            #{item.numEmpleado || "—"}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" fontWeight={700}>
          {item.descripcion}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {formatDate(item.fechaInicio)} — {formatDate(item.fechaFin)}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          size="small"
          color={getStatusColor(item.estatus)}
          label={formatLabel(item.estatus)}
          sx={{ fontWeight: 800 }}
        />
      </TableCell>

      <TableCell align="right">
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => navigate(item.urlDetalle || tipo.route)}
          sx={{ borderRadius: 1.5, fontWeight: 800 }}
        >
          Revisar
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function MisAprobacionesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["mis-aprobaciones"],
    queryFn: getMisAprobaciones,
  });

  const items = data?.items ?? [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
            color: "white",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.12)",
                  flexShrink: 0,
                }}
              >
                <FactCheckIcon />
              </Box>

              <Box>
                <Typography variant="overline" sx={{ opacity: 0.78 }}>
                  GRANVIA Recursos Humanos
                </Typography>

                <Typography variant="h4" fontWeight={900}>
                  Mis aprobaciones
                </Typography>

                <Typography sx={{ opacity: 0.78, mt: 0.5 }}>
                  Bandeja central de pendientes de incidencias y vacaciones.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={
                isFetching ? <CircularProgress size={16} /> : <RefreshIcon />
              }
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{
                borderRadius: 1.5,
                fontWeight: 900,
                bgcolor: "white",
                color: "grey.900",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              Actualizar
            </Button>
          </Stack>
        </Paper>

        {isError && (
          <Alert severity="error">
            No se pudieron cargar las aprobaciones.{" "}
            {error instanceof Error ? error.message : ""}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <MetricCard
            title="Total pendientes"
            value={data?.totalPendientes ?? 0}
            caption="Requieren revisión"
            icon={<PlaylistAddCheckCircleIcon />}
          />

          <MetricCard
            title="Incidencias"
            value={data?.incidenciasPendientes ?? 0}
            caption="Pendientes por aprobar"
            icon={<AssignmentTurnedInIcon />}
          />

          <MetricCard
            title="Vacaciones"
            value={data?.vacacionesPendientes ?? 0}
            caption="Solicitudes pendientes"
            icon={<BeachAccessIcon />}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={{ px: 2.5, py: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Pendientes por revisar
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Vista consolidada de trámites que requieren atención.
              </Typography>
            </Box>

            <Chip
              label={`${items.length} visible(s)`}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          <Divider />

          {isLoading ? (
            <Box sx={{ p: 5, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ p: 2.5 }}>
              <EmptyState />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Periodo</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => (
                    <AprobacionRow
                      key={`${item.tipo}-${item.id}`}
                      item={item}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}