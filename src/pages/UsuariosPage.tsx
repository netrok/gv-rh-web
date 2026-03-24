import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAuth } from "../features/auth/AuthContext";
import {
  createUsuario,
  getUsuarios,
  updateUsuario,
  type SaveUsuarioInput,
  type Usuario,
} from "../api/usuarios.api";

type FormState = {
  email: string;
  role: string;
  activo: boolean;
  password: string;
  confirmPassword: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

const initialForm: FormState = {
  email: "",
  role: "RRHH",
  activo: true,
  password: "",
  confirmPassword: "",
};

const AVAILABLE_ROLES = ["ADMIN", "RRHH"] as const;

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role) => String(role).trim().toUpperCase());
}

function getPrimaryRole(usuario: Usuario): string {
  return normalizeRoles(usuario.roles)[0] ?? "";
}

function getDisplayName(usuario: Usuario): string {
  const nombre = String(usuario.nombre ?? "").trim();
  if (nombre) return nombre;

  const email = String(usuario.email ?? "").trim();
  if (!email) return "Usuario";

  return email.split("@")[0] ?? email;
}

function buildNombreFromEmail(email: string): string {
  const clean = email.trim();
  if (!clean) return "";
  return clean.split("@")[0] ?? clean;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizePayload(form: FormState): SaveUsuarioInput {
  return {
    nombre: buildNombreFromEmail(form.email),
    email: form.email.trim(),
    roles: [form.role.trim()],
    activo: form.activo,
    ...(form.password.trim() ? { password: form.password.trim() } : {}),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function usuarioStatusChipSx(activo: boolean) {
  if (activo) {
    return {
      bgcolor: "rgba(46, 125, 50, 0.10)",
      color: "success.dark",
      borderColor: "rgba(46, 125, 50, 0.34)",
      fontWeight: 800,
    };
  }

  return {
    bgcolor: "rgba(100, 116, 139, 0.08)",
    color: "text.secondary",
    borderColor: "rgba(100, 116, 139, 0.24)",
    fontWeight: 800,
  };
}

function roleChipSx(role: string) {
  if (role === "ADMIN") {
    return {
      width: "fit-content",
      fontWeight: 800,
      bgcolor: alpha("#1d4ed8", 0.08),
      color: "#1d4ed8",
      borderColor: alpha("#1d4ed8", 0.18),
    };
  }

  return {
    width: "fit-content",
    fontWeight: 800,
    bgcolor: "rgba(100, 116, 139, 0.06)",
    color: "text.secondary",
    borderColor: "rgba(100, 116, 139, 0.18)",
  };
}

function actionIconButtonSx(kind: "edit" | "delete" | "restore") {
  if (kind === "edit") {
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

  if (kind === "restore") {
    return {
      width: 36,
      height: 36,
      borderRadius: "12px",
      border: `1px solid ${alpha("#2e7d32", 0.14)}`,
      backgroundColor: alpha("#2e7d32", 0.05),
      color: "#2e7d32",
      "&:hover": {
        backgroundColor: alpha("#2e7d32", 0.1),
        borderColor: alpha("#2e7d32", 0.24),
      },
    };
  }

  return {
    width: 36,
    height: 36,
    borderRadius: "12px",
    border: `1px solid ${alpha("#dc2626", 0.14)}`,
    backgroundColor: alpha("#dc2626", 0.05),
    color: "#dc2626",
    "&:hover": {
      backgroundColor: alpha("#dc2626", 0.1),
      borderColor: alpha("#dc2626", 0.24),
    },
  };
}

function filterToggleBoxSx() {
  return {
    minHeight: 40,
    px: 1.25,
    borderRadius: "14px",
    border: `1px solid ${alpha("#0f172a", 0.08)}`,
    backgroundColor: alpha("#0f172a", 0.02),
    display: "flex",
    alignItems: "center",
  };
}

export default function UsuariosPage() {
  const { roles } = useAuth();

  const [rows, setRows] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitError, setSubmitError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

  async function loadUsuarios(showInitialLoader = false) {
    try {
      if (showInitialLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getUsuarios();
      setRows(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error),
        severity: "error",
      });
    } finally {
      if (showInitialLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadUsuarios(true);
  }, []);

  const filteredRows = useMemo(() => {
    const text = q.trim().toLowerCase();

    return rows.filter((row) => {
      const displayName = getDisplayName(row).toLowerCase();
      const email = String(row.email ?? "").toLowerCase();
      const role = getPrimaryRole(row).toLowerCase();

      const matchesText =
        !text ||
        displayName.includes(text) ||
        email.includes(text) ||
        role.includes(text);

      const matchesRole =
        rolFiltro === "TODOS" || getPrimaryRole(row) === rolFiltro;

      const matchesActivo = soloActivos ? row.activo : true;

      return matchesText && matchesRole && matchesActivo;
    });
  }, [rows, q, rolFiltro, soloActivos]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [q, rolFiltro, soloActivos, filteredRows.length]);

  const activeCount = useMemo(
    () => rows.filter((row) => row.activo).length,
    [rows]
  );

  const inactiveCount = useMemo(
    () => rows.filter((row) => !row.activo).length,
    [rows]
  );

  const adminCount = useMemo(
    () => rows.filter((row) => getPrimaryRole(row) === "ADMIN").length,
    [rows]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count += 1;
    if (rolFiltro !== "TODOS") count += 1;
    if (soloActivos) count += 1;
    return count;
  }, [q, rolFiltro, soloActivos]);

  function handleOpenCreate() {
    setEditing(null);
    setForm(initialForm);
    setSubmitError("");
    setDialogOpen(true);
  }

  function handleOpenEdit(item: Usuario) {
    setEditing(item);
    setForm({
      email: item.email,
      role: getPrimaryRole(item) || "RRHH",
      activo: item.activo,
      password: "",
      confirmPassword: "",
    });
    setSubmitError("");
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
    setForm(initialForm);
    setSubmitError("");
  }

  function handleTextChange(field: "email" | "password" | "confirmPassword") {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };
  }

  function handleRoleChange(event: SelectChangeEvent<string>) {
    setForm((prev) => ({
      ...prev,
      role: event.target.value,
    }));
  }

  function handleActivoChange(
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) {
    setForm((prev) => ({
      ...prev,
      activo: checked,
    }));
  }

  async function handleSubmit() {
    setSubmitError("");

    const payload = normalizePayload(form);

    if (!payload.email) {
      setSubmitError("El correo es obligatorio.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setSubmitError("Ingresa un correo válido.");
      return;
    }

    if (!payload.roles[0]) {
      setSubmitError("Selecciona un rol.");
      return;
    }

    if (!editing) {
      if (!form.password.trim()) {
        setSubmitError("La contraseña es obligatoria.");
        return;
      }

      if (form.password.trim().length < 6) {
        setSubmitError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setSubmitError("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      setSaving(true);

      if (editing) {
        await updateUsuario(editing.id, payload);
        setSnackbar({
          open: true,
          message: "Usuario actualizado.",
          severity: "success",
        });
      } else {
        await createUsuario(payload);
        setSnackbar({
          open: true,
          message: "Usuario creado.",
          severity: "success",
        });
      }

      handleCloseDialog();
      await loadUsuarios(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmToggle() {
    if (!confirmTarget) return;

    const role = getPrimaryRole(confirmTarget);

    try {
      setProcessingId(confirmTarget.id);

      await updateUsuario(confirmTarget.id, {
        nombre: getDisplayName(confirmTarget),
        email: confirmTarget.email,
        roles: role ? [role] : [],
        activo: !confirmTarget.activo,
      });

      setSnackbar({
        open: true,
        message: confirmTarget.activo
          ? "Usuario desactivado."
          : "Usuario activado.",
        severity: "success",
      });

      setConfirmTarget(null);
      await loadUsuarios(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error),
        severity: "error",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Usuarios"
      subtitle="Administra las cuentas internas, su rol, acceso y estatus operativo."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadUsuarios(false)}
            disabled={refreshing}
          >
            {refreshing ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreate}
          >
            Nuevo usuario
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de usuarios"
        subtitle="Controla las cuentas del sistema, su rol asignado y el acceso operativo para cada perfil interno."
        badge="RH"
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
                  {rows.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  visibles
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {activeCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  activas
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Base de acceso lista para asignar seguridad y operar el sistema de RH.
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
          value={rows.length}
          subtitle="Usuarios visibles"
          icon={<GroupsRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Activas"
          value={activeCount}
          subtitle="Operando en sistema"
          icon={<CheckCircleRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Inactivas"
          value={inactiveCount}
          subtitle="Deshabilitadas"
          icon={<DoNotDisturbOnRoundedIcon fontSize="small" />}
          badge="RH"
        />
        <MetricCard
          title="Administradores"
          value={adminCount}
          subtitle="Con rol ADMIN"
          icon={<AdminPanelSettingsRoundedIcon fontSize="small" />}
          badge="RH"
        />
      </Box>

      <SectionCard
        title="Filtros"
        subtitle="Busca por correo, nombre visible o rol y filtra el estado."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={
              activeFiltersCount > 0
                ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} activo${activeFiltersCount > 1 ? "s" : ""}`
                : "Sin filtros"
            }
          />
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(12, 1fr)",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 5" } }}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Correo, nombre visible o rol"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                label="Rol"
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value)}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                {AVAILABLE_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
            <Box sx={filterToggleBoxSx()}>
              <FormControlLabel
                control={
                  <Switch
                    checked={soloActivos}
                    onChange={(_, checked) => setSoloActivos(checked)}
                  />
                }
                label="Solo activas"
                sx={{ m: 0 }}
              />
            </Box>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ClearRoundedIcon />}
              onClick={() => {
                setQ("");
                setRolFiltro("TODOS");
                setSoloActivos(true);
              }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Limpiar filtros
            </Button>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Catálogo de usuarios"
        subtitle="Revisión general de cuentas, rol asignado, seguridad y estado operativo."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={`${paginatedRows.length} visibles de ${filteredRows.length}`}
          />
        }
      >
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="info">
              No hay usuarios para los filtros actuales.
            </Alert>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 220 }}>Usuario</TableCell>
                    <TableCell sx={{ minWidth: 250 }}>Correo</TableCell>
                    <TableCell sx={{ width: 130 }}>Rol</TableCell>
                    <TableCell sx={{ width: 130 }}>Estado</TableCell>
                    <TableCell sx={{ width: 180 }}>Seguridad</TableCell>
                    <TableCell sx={{ width: 190 }}>Creado</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row) => {
                    const role = getPrimaryRole(row);

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          backgroundColor: row.activo
                            ? "transparent"
                            : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700}>
                              {getDisplayName(row)}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={<BadgeRoundedIcon />}
                              label={`ID ${row.id}`}
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

                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailRoundedIcon
                              fontSize="small"
                              sx={{ color: "text.secondary" }}
                            />
                            <Typography variant="body2">{row.email}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {role ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={role}
                              sx={roleChipSx(role)}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin rol
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={row.activo ? "Activa" : "Inactiva"}
                            sx={usuarioStatusChipSx(row.activo)}
                          />
                        </TableCell>

                        <TableCell>
                          {row.mustChangePassword ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={<LockResetRoundedIcon />}
                              label="Cambio requerido"
                              sx={{
                                fontWeight: 800,
                                bgcolor: alpha("#d97706", 0.06),
                                color: "#b45309",
                                borderColor: alpha("#d97706", 0.2),
                              }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={<ShieldRoundedIcon />}
                              label="Normal"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "rgba(100, 116, 139, 0.06)",
                                color: "text.secondary",
                                borderColor: "rgba(100, 116, 139, 0.18)",
                              }}
                            />
                          )}
                        </TableCell>

                        <TableCell>{formatDateTime(row.createdAtUtc)}</TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(row)}
                                sx={actionIconButtonSx("edit")}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={row.activo ? "Desactivar" : "Activar"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setConfirmTarget(row)}
                                  disabled={processingId === row.id}
                                  sx={actionIconButtonSx(
                                    row.activo ? "delete" : "restore"
                                  )}
                                >
                                  {row.activo ? (
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                  ) : (
                                    <ReplayRoundedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(
                e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </SectionCard>

      <Dialog
        open={dialogOpen}
        onClose={(_, __) => {
          if (!saving) handleCloseDialog();
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={800}>
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editing
                ? "Actualiza el correo, rol y estado operativo de la cuenta."
                : "Captura los datos básicos para crear una nueva cuenta interna."}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.4fr 0.8fr" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <TextField
                fullWidth
                label="Correo"
                type="email"
                placeholder="usuario@empresa.com"
                value={form.email}
                onChange={handleTextChange("email")}
                helperText="Se usará como identificador principal de acceso."
              />

              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  label="Rol"
                  value={form.role}
                  onChange={handleRoleChange}
                >
                  {AVAILABLE_ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={form.activo}
                    onChange={handleActivoChange}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={700}>Usuario activo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Define si la cuenta puede ingresar al sistema.
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: "flex-start" }}
              />
            </Box>

            {!editing ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.default",
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography fontWeight={800}>
                      Credenciales iniciales
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Define la contraseña temporal con la que entrará el usuario.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Contraseña"
                      type="password"
                      value={form.password}
                      onChange={handleTextChange("password")}
                      helperText="Mínimo 6 caracteres."
                    />

                    <TextField
                      fullWidth
                      label="Confirmar contraseña"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleTextChange("confirmPassword")}
                      helperText="Debe coincidir exactamente."
                    />
                  </Box>
                </Stack>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, py: 2, justifyContent: "space-between" }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {editing
              ? "Ajusta los datos y guarda los cambios."
              : "Verifica la información antes de crear la cuenta."}
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancelar
            </Button>

            <Button variant="contained" onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Guardando..."
                : editing
                ? "Guardar cambios"
                : "Crear usuario"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmTarget}
        onClose={(_, __) => {
          if (processingId === null) setConfirmTarget(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {confirmTarget?.activo ? "Desactivar usuario" : "Activar usuario"}
        </DialogTitle>

        <DialogContent dividers>
          <Typography>
            {confirmTarget
              ? confirmTarget.activo
                ? `Se desactivará el usuario "${getDisplayName(confirmTarget)}".`
                : `Se activará el usuario "${getDisplayName(confirmTarget)}".`
              : ""}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setConfirmTarget(null)}
            disabled={processingId !== null}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            color={confirmTarget?.activo ? "warning" : "success"}
            onClick={() => void handleConfirmToggle()}
            disabled={processingId !== null}
          >
            {processingId !== null
              ? "Procesando..."
              : confirmTarget?.activo
              ? "Desactivar"
              : "Activar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppPage>
  );
}