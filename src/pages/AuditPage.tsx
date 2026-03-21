import {
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import DatasetLinkedRoundedIcon from "@mui/icons-material/DatasetLinkedRounded";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import AppPage from "../components/ui/AppPage";
import EmptyState from "../components/ui/EmptyState";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAuth } from "../features/auth/AuthContext";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import {
  downloadAuditXlsx,
  getAudit,
  getAuditById,
  type AuditItem,
  type AuditQueryParams,
} from "../api/audit.api";

const entityOptions = [
  "",
  "Auth",
  "Departamento",
  "Puesto",
  "Empleado",
  "Sucursal",
  "Incidencia",
] as const;

const actionOptions = [
  "",
  "LOGIN",
  "REFRESH",
  "LOGOUT",
  "LOGOUT_ALL",
  "CREATE",
  "UPDATE",
  "SOFT_DELETE",
  "RESTORE",
  "DELETE",
] as const;

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function prettyJson(value?: string | null) {
  if (!value) return "-";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado.") {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : (error.response?.data as { message?: string; title?: string } | undefined)
            ?.message ||
          (error.response?.data as { message?: string; title?: string } | undefined)
            ?.title;

    return (
      apiMessage ||
      `${error.response?.status ?? ""} ${
        error.response?.statusText ?? error.message
      }`.trim() ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role) => String(role).trim().toUpperCase());
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

function getActionIcon(action: string): ReactElement {
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

function detailActionButtonSx() {
  return {
    width: 36,
    height: 36,
    borderRadius: "12px",
    border: `1px solid ${alpha("#1d4ed8", 0.14)}`,
    backgroundColor: alpha("#1d4ed8", 0.05),
    color: "#1d4ed8",
    "&:hover": {
      backgroundColor: alpha("#1d4ed8", 0.1),
      borderColor: alpha("#1d4ed8", 0.24),
    },
  };
}

function codeBlockSx(bg: string, color: string) {
  return {
    m: 0,
    p: 2,
    borderRadius: "16px",
    backgroundColor: bg,
    color,
    overflowX: "auto",
    fontSize: 13,
    lineHeight: 1.5,
    border: `1px solid ${alpha("#ffffff", 0.06)}`,
  };
}

export default function AuditPage() {
  const { roles } = useAuth();
  const { showSnackbar } = useAppSnackbar();

  const [filters, setFilters] = useState({
    entityName: "",
    action: "",
    email: "",
    from: "",
    to: "",
    q: "",
  });

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

  const queryParams: AuditQueryParams = useMemo(
    () => ({
      entityName: filters.entityName || undefined,
      action: filters.action || undefined,
      email: filters.email || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      page: page + 1,
      pageSize,
    }),
    [filters, page, pageSize]
  );

  const auditQuery = useQuery({
    queryKey: ["audit", queryParams],
    queryFn: () => getAudit(queryParams),
    placeholderData: (previousData) => previousData,
  });

  const detailQuery = useQuery({
    queryKey: ["audit-detail", selectedId],
    queryFn: () => getAuditById(selectedId!),
    enabled: selectedId !== null,
  });

  const handleFilterChange =
    (field: keyof typeof filters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPage(0);
      setFilters((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleClearFilters = () => {
    setPage(0);
    setFilters({
      entityName: "",
      action: "",
      email: "",
      from: "",
      to: "",
      q: "",
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadAuditXlsx(queryParams);
      showSnackbar("Auditoría exportada correctamente.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error, "No se pudo exportar la auditoría."), "error");
    } finally {
      setExporting(false);
    }
  };

  const rows: AuditItem[] = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total ?? 0;
  const isRefreshing = auditQuery.isFetching && !auditQuery.isLoading;

  const authEventsCount = useMemo(
    () =>
      rows.filter((row) =>
        ["LOGIN", "REFRESH", "LOGOUT", "LOGOUT_ALL"].includes(row.action)
      ).length,
    [rows]
  );

  const changeEventsCount = useMemo(
    () =>
      rows.filter((row) =>
        ["CREATE", "UPDATE", "SOFT_DELETE", "RESTORE", "DELETE"].includes(row.action)
      ).length,
    [rows]
  );

  const uniqueUsersCount = useMemo(() => {
    return new Set(
      rows
        .map((row) => (row.userEmail ?? "").trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }, [rows]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.entityName) count += 1;
    if (filters.action) count += 1;
    if (filters.email.trim()) count += 1;
    if (filters.from) count += 1;
    if (filters.to) count += 1;
    if (filters.q.trim()) count += 1;
    return count;
  }, [filters]);

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Auditoría"
      subtitle="Consulta eventos de autenticación y movimientos de entidades del sistema."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={() => auditQuery.refetch()}
            disabled={auditQuery.isFetching || exporting}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={auditQuery.isLoading || exporting}
          >
            {exporting ? "Exportando..." : "Exportar XLSX"}
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Bitácora RH"
        title="Trazabilidad de auditoría"
        subtitle="Supervisa eventos de acceso, cambios críticos y movimientos sobre catálogos y operaciones del sistema."
        badge="AUDIT"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.18),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 800,
                  }}
                />
              ))
            ) : (
              <Chip
                label="Sin roles detectados"
                size="small"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.18),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        }
        aside={
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {formatNumber(total)}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  total
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {uniqueUsersCount}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  usuarios
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {activeFiltersCount}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  filtros
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Bitácora lista para revisión operativa, soporte y cumplimiento.
            </Typography>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: { xs: 2, md: 2.25 },
        }}
      >
        <MetricCard
          title="Total"
          value={formatNumber(total)}
          subtitle="Registros según filtros actuales"
          icon={<AssessmentRoundedIcon fontSize="small" />}
          badge="AUDIT"
        />
        <MetricCard
          title="Visibles"
          value={rows.length}
          subtitle="Registros cargados en esta página"
          icon={<ManageSearchRoundedIcon fontSize="small" />}
          badge="AUDIT"
        />
        <MetricCard
          title="Eventos de acceso"
          value={authEventsCount}
          subtitle="Login, refresh y logout"
          icon={<VerifiedUserRoundedIcon fontSize="small" />}
          badge="AUDIT"
        />
        <MetricCard
          title="Cambios de datos"
          value={changeEventsCount}
          subtitle="Create, update, delete y restore"
          icon={<RuleRoundedIcon fontSize="small" />}
          badge="AUDIT"
        />
      </Box>

      {auditQuery.isError ? (
        <Alert severity="error">
          No se pudo cargar la auditoría.
          <br />
          {getErrorMessage(auditQuery.error, "Error desconocido")}
        </Alert>
      ) : null}

      <SectionCard
        title="Filtros"
        subtitle="Refina por entidad, acción, correo, fechas o texto libre."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              color={activeFiltersCount > 0 ? "primary" : undefined}
              label={
                activeFiltersCount > 0
                  ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} activo${activeFiltersCount > 1 ? "s" : ""}`
                  : "Sin filtros"
              }
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={activeFiltersCount === 0}
            >
              Limpiar
            </Button>
          </Stack>
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              xl: "repeat(12, 1fr)",
            },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              select
              label="Entidad"
              value={filters.entityName}
              onChange={handleFilterChange("entityName")}
            >
              {entityOptions.map((option) => (
                <MenuItem key={option || "all-entity"} value={option}>
                  {option || "Todas"}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              select
              label="Acción"
              value={filters.action}
              onChange={handleFilterChange("action")}
            >
              {actionOptions.map((option) => (
                <MenuItem key={option || "all-action"} value={option}>
                  {option || "Todas"}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              label="Correo"
              value={filters.email}
              onChange={handleFilterChange("email")}
              placeholder="admin@rh.local"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonSearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              label="Desde"
              type="date"
              value={filters.from}
              onChange={handleFilterChange("from")}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              label="Hasta"
              type="date"
              value={filters.to}
              onChange={handleFilterChange("to")}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", xl: "span 2" } }}>
            <TextField
              label="Buscar"
              value={filters.q}
              onChange={handleFilterChange("q")}
              placeholder="usuario, entidad, registro..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2 }}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
        >
          {isRefreshing ? (
            <Chip size="small" label="Actualizando..." color="info" />
          ) : null}

          <Chip
            size="small"
            label={`Usuarios visibles: ${uniqueUsersCount}`}
            variant="outlined"
          />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Registros de auditoría"
        subtitle="Trazabilidad de autenticación y cambios sobre entidades del sistema."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={`${rows.length} visibles de ${formatNumber(total)}`}
          />
        }
      >
        {auditQuery.isLoading && !auditQuery.data ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<SecurityRoundedIcon sx={{ fontSize: 52 }} />}
            title="No hay registros para mostrar"
            description="No se encontraron eventos de auditoría con los filtros actuales. Ajusta la búsqueda o limpia los filtros."
            actionLabel={activeFiltersCount > 0 ? "Limpiar filtros" : undefined}
            onAction={activeFiltersCount > 0 ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 640 }}>
              <Table stickyHeader size="small">
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      zIndex: 2,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ width: 80 }}>ID</TableCell>
                    <TableCell sx={{ width: 180 }}>Fecha</TableCell>
                    <TableCell sx={{ width: 170 }}>Acción</TableCell>
                    <TableCell sx={{ width: 150 }}>Entidad</TableCell>
                    <TableCell sx={{ width: 120 }}>Registro</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Usuario</TableCell>
                    <TableCell sx={{ width: 120 }}>Rol</TableCell>
                    <TableCell sx={{ width: 150 }}>IP</TableCell>
                    <TableCell align="right" sx={{ width: 90 }}>
                      Detalle
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "& td": {
                          verticalAlign: "middle",
                        },
                      }}
                    >
                      <TableCell>{row.id}</TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(row.occurredAtUtc)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          icon={getActionIcon(row.action)}
                          label={row.action}
                          color={getActionColor(row.action)}
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.35}>
                          <Typography fontWeight={700}>
                            {row.entityName || "-"}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<DatasetLinkedRoundedIcon />}
                            label={row.recordId ?? "Sin registro"}
                            sx={{
                              width: "fit-content",
                              fontWeight: 800,
                              bgcolor: alpha("#1d4ed8", 0.05),
                              color: "#1d4ed8",
                              borderColor: alpha("#1d4ed8", 0.18),
                            }}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell>{row.recordId ?? "-"}</TableCell>
                      <TableCell>{row.userEmail ?? "-"}</TableCell>
                      <TableCell>{row.userRole ?? "-"}</TableCell>
                      <TableCell>{row.ipAddress ?? "-"}</TableCell>

                      <TableCell align="right">
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedId(row.id)}
                            sx={detailActionButtonSx()}
                          >
                            <VisibilityRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPage(0);
                setPageSize(Number(event.target.value));
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${
                  count !== -1 ? formatNumber(count) : `más de ${to}`
                }`
              }
            />
          </>
        )}
      </SectionCard>

      <Dialog
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalle de auditoría</DialogTitle>

        <DialogContent dividers>
          {detailQuery.isLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : detailQuery.isError ? (
            <Alert severity="error">No se pudo cargar el detalle.</Alert>
          ) : detailQuery.data ? (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography>{detailQuery.data.id}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography>{formatDate(detailQuery.data.occurredAtUtc)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Acción
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      icon={getActionIcon(detailQuery.data.action)}
                      label={detailQuery.data.action}
                      color={getActionColor(detailQuery.data.action)}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Entidad
                  </Typography>
                  <Typography>{detailQuery.data.entityName || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Registro
                  </Typography>
                  <Typography>{detailQuery.data.recordId ?? "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography>{detailQuery.data.userEmail ?? "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rol
                  </Typography>
                  <Typography>{detailQuery.data.userRole ?? "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    IP
                  </Typography>
                  <Typography>{detailQuery.data.ipAddress ?? "-"}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Columnas modificadas
                </Typography>
                <Box component="pre" sx={codeBlockSx("#0f172a", "#e2e8f0")}>
                  {prettyJson(detailQuery.data.changedColumnsJson)}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Valores anteriores
                </Typography>
                <Box component="pre" sx={codeBlockSx("#111827", "#f3f4f6")}>
                  {prettyJson(detailQuery.data.oldValuesJson)}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Valores nuevos
                </Typography>
                <Box component="pre" sx={codeBlockSx("#111827", "#f3f4f6")}>
                  {prettyJson(detailQuery.data.newValuesJson)}
                </Box>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedId(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}