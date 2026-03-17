import { useMemo, useState, type ChangeEvent } from "react";
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
  Grid,
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
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import {
  downloadAuditXlsx,
  getAudit,
  getAuditById,
  type AuditItem,
  type AuditQueryParams,
} from "../api/audit.api";

const entityOptions = ["", "Auth", "Departamento", "Puesto", "Empleado"];
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

function prettyJson(value?: string | null) {
  if (!value) return "-";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
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
    await downloadAuditXlsx(queryParams);
  };

  const rows = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total ?? 0;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", lg: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <HistoryRoundedIcon fontSize="small" />
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Monitoreo y trazabilidad
            </Typography>
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, mb: 0.5 }}>
            Auditoría
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Consulta de eventos de autenticación y movimientos de entidades del sistema.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{ width: { xs: "100%", lg: "auto" } }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => auditQuery.refetch()}
            disabled={auditQuery.isFetching}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {auditQuery.isFetching ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={auditQuery.isLoading}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            Exportar XLSX
          </Button>
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterAltOutlinedIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                Filtros
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={`${total} registro${total === 1 ? "" : "s"}`}
                color="default"
                variant="outlined"
              />
              {auditQuery.isFetching ? (
                <Chip size="small" label="Actualizando..." color="info" />
              ) : null}
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                select
                label="Entidad"
                value={filters.entityName}
                onChange={handleFilterChange("entityName")}
                size="small"
              >
                {entityOptions.map((option) => (
                  <MenuItem key={option || "all"} value={option}>
                    {option || "Todas"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                select
                label="Acción"
                value={filters.action}
                onChange={handleFilterChange("action")}
                size="small"
              >
                {actionOptions.map((option) => (
                  <MenuItem key={option || "all"} value={option}>
                    {option || "Todas"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="Correo"
                value={filters.email}
                onChange={handleFilterChange("email")}
                placeholder="admin@rh.local"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                value={filters.from}
                onChange={handleFilterChange("from")}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                value={filters.to}
                onChange={handleFilterChange("to")}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 8, lg: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                value={filters.q}
                onChange={handleFilterChange("q")}
                placeholder="usuario, entidad, registro..."
                size="small"
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Button
              variant="text"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {auditQuery.isLoading && !auditQuery.data ? (
            <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : auditQuery.isError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">
                No se pudo cargar la auditoría.
                <br />
                {axios.isAxiosError(auditQuery.error)
                  ? `${auditQuery.error.response?.status ?? ""} ${
                      auditQuery.error.response?.statusText ?? auditQuery.error.message
                    }`
                  : (auditQuery.error as Error)?.message ?? "Error desconocido"}
              </Alert>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Registros de auditoría
                </Typography>
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          backgroundColor: "#f8fafc",
                          color: "#475569",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
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
                      rows.map((row: AuditItem) => (
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
                              label={row.action}
                              color={getActionColor(row.action)}
                            />
                          </TableCell>
                          <TableCell>{row.entityName}</TableCell>
                          <TableCell>{row.recordId}</TableCell>
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
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography>{detailQuery.data.id}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography>{formatDate(detailQuery.data.occurredAtUtc)}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Acción
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={detailQuery.data.action}
                      color={getActionColor(detailQuery.data.action)}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Entidad
                  </Typography>
                  <Typography>{detailQuery.data.entityName}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Registro
                  </Typography>
                  <Typography>{detailQuery.data.recordId}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography>{detailQuery.data.userEmail ?? "-"}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Rol
                  </Typography>
                  <Typography>{detailQuery.data.userRole ?? "-"}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    IP
                  </Typography>
                  <Typography>{detailQuery.data.ipAddress ?? "-"}</Typography>
                </Grid>
              </Grid>

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