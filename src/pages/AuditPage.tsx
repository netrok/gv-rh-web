import { useMemo, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
            (event: React.ChangeEvent<HTMLInputElement>) => {
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
        <Box sx={{ p: 3, backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Auditoría
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Consulta de movimientos y eventos de autenticación.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => auditQuery.refetch()}
                    >
                        Actualizar
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={auditQuery.isLoading}
                    >
                        Exportar XLSX
                    </Button>
                </Stack>
            </Stack>

            <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Filtros
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                select
                                label="Entidad"
                                value={filters.entityName}
                                onChange={handleFilterChange("entityName")}
                            >
                                {entityOptions.map((option) => (
                                    <MenuItem key={option || "all"} value={option}>
                                        {option || "Todas"}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                select
                                label="Acción"
                                value={filters.action}
                                onChange={handleFilterChange("action")}
                            >
                                {actionOptions.map((option) => (
                                    <MenuItem key={option || "all"} value={option}>
                                        {option || "Todas"}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                label="Correo"
                                value={filters.email}
                                onChange={handleFilterChange("email")}
                                placeholder="admin@rh.local"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                label="Desde"
                                type="date"
                                value={filters.from}
                                onChange={handleFilterChange("from")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                label="Hasta"
                                type="date"
                                value={filters.to}
                                onChange={handleFilterChange("to")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                label="Buscar"
                                value={filters.q}
                                onChange={handleFilterChange("q")}
                                placeholder="usuario, entidad, registro..."
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            variant="text"
                            color="inherit"
                            startIcon={<ClearIcon />}
                            onClick={handleClearFilters}
                        >
                            Limpiar filtros
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 0 }}>
                    {auditQuery.isLoading && !auditQuery.data ? (
                        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
                            <CircularProgress />
                        </Box>
                    ) : auditQuery.isError ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="error">
                                No se pudo cargar la auditoría.
                                <br />
                                {axios.isAxiosError(auditQuery.error)
                                    ? `${auditQuery.error.response?.status ?? ""} ${auditQuery.error.response?.statusText ?? auditQuery.error.message}`
                                    : (auditQuery.error as Error)?.message ?? "Error desconocido"}
                            </Alert>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ overflowX: "auto" }}>
                                <Table size="small">
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
                                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        No hay registros para los filtros actuales.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row: AuditItem) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell>{row.id}</TableCell>
                                                    <TableCell>{formatDate(row.occurredAtUtc)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={row.action}
                                                            color={getActionColor(row.action)}
                                                            variant="filled"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{row.entityName}</TableCell>
                                                    <TableCell>{row.recordId}</TableCell>
                                                    <TableCell>{row.userEmail ?? "-"}</TableCell>
                                                    <TableCell>{row.userRole ?? "-"}</TableCell>
                                                    <TableCell>{row.ipAddress ?? "-"}</TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Ver detalle">
                                                            <IconButton onClick={() => setSelectedId(row.id)}>
                                                                <VisibilityIcon />
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
                                    <Typography>
                                        {formatDate(detailQuery.data.occurredAtUtc)}
                                    </Typography>
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