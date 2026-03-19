import { useMemo, useState, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import PageHeader from "../components/ui/PageHeader";
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

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  badge?: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        height: "100%",
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mt: 0.75, lineHeight: 1 }}
            >
              {value}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          </Box>

          <Stack alignItems="flex-end" spacing={1}>
            {badge ? (
              <Chip size="small" label={badge} color="primary" variant="outlined" />
            ) : null}

            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "action.hover",
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AuditPage() {
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
    (event: ChangeEvent<HTMLInputElement>) => {
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
    } finally {
      setExporting(false);
    }
  };

  const rows: AuditItem[] = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total ?? 0;

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

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        title="Auditoría"
        subtitle="Consulta eventos de autenticación y movimientos de entidades del sistema."
        actions={[
          {
            label: auditQuery.isFetching ? "Actualizando..." : "Actualizar",
            variant: "outlined",
            startIcon: <RefreshIcon />,
            onClick: () => auditQuery.refetch(),
            disabled: auditQuery.isFetching,
          },
          {
            label: exporting ? "Exportando..." : "Exportar XLSX",
            variant: "contained",
            startIcon: <DownloadIcon />,
            onClick: handleExport,
            disabled: auditQuery.isLoading || exporting,
          },
        ]}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
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

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 2 }}
          >
            <FilterAltOutlinedIcon fontSize="small" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Refina por entidad, acción, correo, fechas o texto libre.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(6, 1fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              select
              label="Entidad"
              value={filters.entityName}
              onChange={handleFilterChange("entityName")}
              size="small"
            >
              {entityOptions.map((option) => (
                <MenuItem key={option || "all-entity"} value={option}>
                  {option || "Todas"}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Acción"
              value={filters.action}
              onChange={handleFilterChange("action")}
              size="small"
            >
              {actionOptions.map((option) => (
                <MenuItem key={option || "all-action"} value={option}>
                  {option || "Todas"}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Correo"
              value={filters.email}
              onChange={handleFilterChange("email")}
              placeholder="admin@rh.local"
              size="small"
            />

            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={filters.from}
              onChange={handleFilterChange("from")}
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={filters.to}
              onChange={handleFilterChange("to")}
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              fullWidth
              label="Buscar"
              value={filters.q}
              onChange={handleFilterChange("q")}
              placeholder="usuario, entidad, registro..."
              size="small"
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button
              variant="text"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Limpiar filtros
            </Button>

            {auditQuery.isFetching ? (
              <Chip size="small" label="Actualizando..." color="info" />
            ) : null}

            <Chip
              size="small"
              label={`Usuarios visibles: ${uniqueUsersCount}`}
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRoundedIcon fontSize="small" />
                <Typography variant="h6" fontWeight={700}>
                  Registros de auditoría
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Trazabilidad de autenticación y cambios sobre entidades del sistema.
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${rows.length} visibles de ${formatNumber(total)}`}
              variant="outlined"
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {auditQuery.isLoading && !auditQuery.data ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : auditQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar la auditoría.
              <br />
              {getErrorMessage(auditQuery.error, "Error desconocido")}
            </Alert>
          ) : (
            <>
              <Box sx={{ overflowX: "auto", maxHeight: 640 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Acción</TableCell>
                      <TableCell>Entidad</TableCell>
                      <TableCell>Registro</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell align="center">Detalle</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No hay registros para los filtros actuales.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
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

                          <TableCell>{row.entityName || "-"}</TableCell>
                          <TableCell>{row.recordId ?? "-"}</TableCell>
                          <TableCell>{row.userEmail ?? "-"}</TableCell>
                          <TableCell>{row.userRole ?? "-"}</TableCell>
                          <TableCell>{row.ipAddress ?? "-"}</TableCell>

                          <TableCell align="center">
                            <Tooltip title="Ver detalle">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedId(row.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                  `${from}-${to} de ${count !== -1 ? formatNumber(count) : `más de ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

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
            <Stack spacing={2}>
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

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Columnas modificadas
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#0f172a",
                    color: "#e2e8f0",
                    overflowX: "auto",
                    fontSize: 13,
                  }}
                >
                  {prettyJson(detailQuery.data.changedColumnsJson)}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Valores anteriores
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#111827",
                    color: "#f3f4f6",
                    overflowX: "auto",
                    fontSize: 13,
                  }}
                >
                  {prettyJson(detailQuery.data.oldValuesJson)}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Valores nuevos
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#111827",
                    color: "#f3f4f6",
                    overflowX: "auto",
                    fontSize: 13,
                  }}
                >
                  {prettyJson(detailQuery.data.newValuesJson)}
                </Box>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}