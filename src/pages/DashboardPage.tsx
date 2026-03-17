import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import { getAudit, type AuditItem } from "../api/audit.api";

type QuickAction = {
  label: string;
  description: string;
  to: string;
  allow?: string[];
  icon: React.ReactNode;
};

function normalizeRoles(roles?: string[] | null): string[] {
  return [...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean))];
}

function canAccess(userRoles: string[], allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role.toUpperCase()));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getActionColor(
  action: string
): "default" | "success" | "info" | "error" | "warning" | "secondary" {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "SOFT_DELETE":
    case "DELETE":
      return "error";
    case "RESTORE":
      return "warning";
    case "LOGIN":
    case "REFRESH":
    case "LOGOUT":
    case "LOGOUT_ALL":
      return "secondary";
    default:
      return "default";
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "LOGIN":
    case "REFRESH":
    case "LOGOUT":
    case "LOGOUT_ALL":
      return <LoginRoundedIcon fontSize="small" />;
    case "CREATE":
    case "UPDATE":
      return <EditNoteRoundedIcon fontSize="small" />;
    case "SOFT_DELETE":
    case "DELETE":
      return <DeleteOutlineRoundedIcon fontSize="small" />;
    case "RESTORE":
      return <RestoreRoundedIcon fontSize="small" />;
    default:
      return <SecurityRoundedIcon fontSize="small" />;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { roles = [] } = useAuth();

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canSeeAudit = canAccess(normalizedRoles, ["ADMIN", "RRHH"]);

  const quickActions: QuickAction[] = [
    {
      label: "Auditoría",
      description: "Revisa eventos de autenticación y cambios del sistema.",
      to: "/audit",
      allow: ["ADMIN", "RRHH"],
      icon: <GavelRoundedIcon fontSize="small" />,
    },
    {
      label: "Departamentos",
      description: "Administra catálogos de departamentos.",
      to: "/departamentos",
      allow: ["ADMIN", "RRHH"],
      icon: <ApartmentRoundedIcon fontSize="small" />,
    },
    {
      label: "Puestos",
      description: "Administra puestos y su estructura.",
      to: "/puestos",
      allow: ["ADMIN", "RRHH"],
      icon: <WorkOutlineRoundedIcon fontSize="small" />,
    },
    {
      label: "Empleados",
      description: "Consulta y administra expedientes de empleados.",
      to: "/empleados",
      allow: ["ADMIN", "RRHH"],
      icon: <BadgeRoundedIcon fontSize="small" />,
    },
  ].filter((item) => canAccess(normalizedRoles, item.allow));

  const auditQuery = useQuery({
    queryKey: ["dashboard-recent-audit"],
    queryFn: () =>
      getAudit({
        page: 1,
        pageSize: 5,
      }),
    enabled: canSeeAudit,
  });

  const recentRows = auditQuery.data?.items ?? [];

  return (
    <Box>
      <Stack spacing={3}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            background:
              "linear-gradient(135deg, #111827 0%, #1f2937 60%, #0f172a 100%)",
            color: "#fff",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DashboardRoundedIcon fontSize="small" />
                    <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.75)" }}>
                      Panel principal
                    </Typography>
                  </Stack>

                  <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                    Bienvenido a GV RH
                  </Typography>

                  <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 720 }}>
                    Desde aquí puedes entrar rápido a los módulos principales y revisar
                    actividad reciente del sistema sin caer directo a la bitácora como si
                    amaneciéramos en auditoría interna.
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
                    {normalizedRoles.length > 0 ? (
                      normalizedRoles.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          sx={{
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        />
                      ))
                    ) : (
                      <Chip
                        label="Sin roles detectados"
                        size="small"
                        sx={{
                          color: "#fff",
                          backgroundColor: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      />
                    )}
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                        Resumen rápido
                      </Typography>

                      <Typography variant="h5" fontWeight={800}>
                        {quickActions.length}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                        módulos disponibles para tu sesión actual
                      </Typography>

                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon />}
                        onClick={() =>
                          navigate(quickActions[0]?.to ?? "/empleados")
                        }
                        sx={{
                          mt: 1,
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 999,
                          backgroundColor: "#fff",
                          color: "#111827",
                          "&:hover": {
                            backgroundColor: "#f3f4f6",
                          },
                        }}
                      >
                        Ir al sistema
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          {quickActions.map((action) => (
            <Grid key={action.to} size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: "#eef2ff",
                        color: "#4338ca",
                      }}
                    >
                      {action.icon}
                    </Box>

                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                        {action.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>

                    <Button
                      variant="text"
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => navigate(action.to)}
                      sx={{
                        alignSelf: "flex-start",
                        px: 0,
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Abrir módulo
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRoundedIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Actividad reciente
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {!canSeeAudit ? (
                <Alert severity="info">
                  Tu rol actual no tiene acceso a la bitácora de auditoría.
                </Alert>
              ) : auditQuery.isLoading ? (
                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : auditQuery.isError ? (
                <Alert severity="error">
                  No se pudo cargar la actividad reciente.
                  <br />
                  {axios.isAxiosError(auditQuery.error)
                    ? `${auditQuery.error.response?.status ?? ""} ${
                        auditQuery.error.response?.statusText ?? auditQuery.error.message
                      }`
                    : (auditQuery.error as Error)?.message ?? "Error desconocido"}
                </Alert>
              ) : recentRows.length === 0 ? (
                <Alert severity="info">No hay actividad reciente para mostrar.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {recentRows.map((row: AuditItem) => (
                    <Card
                      key={row.id}
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#fff",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          spacing={1.5}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: "#f8fafc",
                                color: "#334155",
                                flexShrink: 0,
                              }}
                            >
                              {getActionIcon(row.action)}
                            </Box>

                            <Box>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                sx={{ mb: 0.5 }}
                              >
                                <Typography fontWeight={700}>
                                  {row.entityName || "Sistema"}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={row.action}
                                  color={getActionColor(row.action)}
                                />
                              </Stack>

                              <Typography variant="body2" color="text.secondary">
                                Usuario: {row.userEmail ?? "-"} · Rol: {row.userRole ?? "-"} ·
                                Registro: {row.recordId ?? "-"}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack alignItems={{ xs: "flex-start", md: "flex-end" }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(row.occurredAtUtc)}
                            </Typography>

                            <Button
                              size="small"
                              onClick={() => navigate("/audit")}
                              sx={{ mt: 0.5, textTransform: "none", fontWeight: 700 }}
                            >
                              Ver auditoría
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}