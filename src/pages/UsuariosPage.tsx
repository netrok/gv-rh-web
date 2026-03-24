import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

import {
  createUsuario,
  getUsuarios,
  type SaveUsuarioInput,
  type Usuario,
  updateUsuario,
} from "../api/usuarios.api";

const AVAILABLE_ROLES = ["ADMIN", "RRHH"] as const;

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

type UsuarioFormState = {
  email: string;
  role: string;
  activo: boolean;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof UsuarioFormState, string>>;

const EMPTY_FORM: UsuarioFormState = {
  email: "",
  role: "RRHH",
  activo: true,
  password: "",
  confirmPassword: "",
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getPrimaryRole(usuario: Usuario) {
  return usuario.roles[0] ?? "";
}

function getDisplayName(usuario: Usuario) {
  const nombre = usuario.nombre?.trim();
  if (nombre) return nombre;

  return usuario.email?.split("@")[0] ?? "Usuario";
}

function buildNombreFromEmail(email: string) {
  const clean = email.trim();
  if (!clean) return "";
  return clean.split("@")[0] ?? clean;
}

function pageCardSx() {
  return {
    borderRadius: 6,
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  };
}

function metricCardSx() {
  return {
    height: "100%",
    borderRadius: 7,
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
  };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [estatusFiltro, setEstatusFiltro] = useState("TODOS");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  async function loadUsuarios(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      console.error("status:", error?.response?.status);
      console.error("data:", error?.response?.data);

      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        error?.response?.data?.detail;

      setSnackbar({
        open: true,
        message:
          serverMessage ||
          `No se pudo cargar el módulo de usuarios${status ? ` (${status})` : ""}.`,
        severity: "error",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadUsuarios();
  }, []);

  const filteredUsuarios = useMemo(() => {
    const text = normalizeText(q);

    return usuarios.filter((usuario) => {
      const nombre = getDisplayName(usuario);
      const role = getPrimaryRole(usuario);

      const matchesText =
        !text ||
        normalizeText(nombre).includes(text) ||
        normalizeText(usuario.email).includes(text) ||
        normalizeText(role).includes(text);

      const matchesRol = rolFiltro === "TODOS" || role === rolFiltro;

      const matchesEstatus =
        estatusFiltro === "TODOS" ||
        (estatusFiltro === "ACTIVOS" && usuario.activo) ||
        (estatusFiltro === "INACTIVOS" && !usuario.activo);

      return matchesText && matchesRol && matchesEstatus;
    });
  }, [usuarios, q, rolFiltro, estatusFiltro]);

  const totalUsuarios = usuarios.length;
  const totalActivos = usuarios.filter((x) => x.activo).length;
  const totalInactivos = usuarios.filter((x) => !x.activo).length;

  function openCreateDialog() {
    setEditingUsuario(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEditDialog(usuario: Usuario) {
    setEditingUsuario(usuario);
    setForm({
      email: usuario.email,
      role: getPrimaryRole(usuario) || "RRHH",
      activo: usuario.activo,
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;

    setDialogOpen(false);
    setEditingUsuario(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleRoleChange(event: SelectChangeEvent<string>) {
    setForm((prev) => ({
      ...prev,
      role: event.target.value,
    }));
  }

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (!form.role.trim()) {
      nextErrors.role = "Selecciona un rol.";
    }

    if (!editingUsuario) {
      if (!form.password.trim()) {
        nextErrors.password = "La contraseña es obligatoria.";
      } else if (form.password.trim().length < 6) {
        nextErrors.password = "La contraseña debe tener al menos 6 caracteres.";
      }

      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Las contraseñas no coinciden.";
      }
    }

    return nextErrors;
  }

  async function handleSave() {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload: SaveUsuarioInput = {
      nombre: buildNombreFromEmail(form.email),
      email: form.email.trim(),
      roles: [form.role],
      activo: form.activo,
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
    };

    try {
      setSaving(true);

      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, payload);
        setSnackbar({
          open: true,
          message: "Usuario actualizado correctamente.",
          severity: "success",
        });
      } else {
        await createUsuario(payload);
        setSnackbar({
          open: true,
          message: "Usuario creado correctamente.",
          severity: "success",
        });
      }

      closeDialog();
      await loadUsuarios(false);
      await loadUsuarios();
    } catch (error: any) {
      console.error("Error guardando usuario:", error);

      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        error?.response?.data?.detail;

      setSnackbar({
        open: true,
        message:
          serverMessage ||
          `No se pudo guardar el usuario${status ? ` (${status})` : ""}.`,
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActivo(usuario: Usuario) {
    const role = getPrimaryRole(usuario);

    try {
      setProcessingId(usuario.id);

      await updateUsuario(usuario.id, {
        nombre: getDisplayName(usuario),
        email: usuario.email,
        roles: role ? [role] : [],
        activo: !usuario.activo,
      });

      setSnackbar({
        open: true,
        message: usuario.activo
          ? "Usuario desactivado correctamente."
          : "Usuario activado correctamente.",
        severity: "success",
      });

      await loadUsuarios(false);
      await loadUsuarios();
    } catch (error: any) {
      console.error("Error cambiando estatus:", error);

      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        error?.response?.data?.detail;

      setSnackbar({
        open: true,
        message:
          serverMessage ||
          `No se pudo actualizar el estatus del usuario${status ? ` (${status})` : ""}.`,
        severity: "error",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={pageCardSx()}>
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", lg: "center" }}
          >
            <Box>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    boxShadow: "0 12px 30px rgba(25, 118, 210, 0.18)",
                  }}
                >
                  <ManageAccountsRoundedIcon />
                </Box>

                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Usuarios
                  </Typography>
                  <Typography color="text.secondary">
                    Administración de accesos, roles y estatus del sistema.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => void loadUsuarios()}
                disabled={loading || saving}
              >
                Recargar
              </Button>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={openCreateDialog}
                disabled={saving}
              >
                Nuevo usuario
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={metricCardSx()}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "primary.50",
                    color: "primary.main",
                  }}
                >
                  <ManageAccountsRoundedIcon />
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {totalUsuarios}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={metricCardSx()}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "success.light",
                    color: "success.dark",
                  }}
                >
                  <PersonRoundedIcon />
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Activos
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {totalActivos}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={metricCardSx()}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "grey.200",
                    color: "text.secondary",
                  }}
                >
                  <PersonOffRoundedIcon />
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Inactivos
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {totalInactivos}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={pageCardSx()}>
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Correo o rol..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <FormControl sx={{ minWidth: 180 }}>
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

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Estatus</InputLabel>
              <Select
                label="Estatus"
                value={estatusFiltro}
                onChange={(e) => setEstatusFiltro(e.target.value)}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ACTIVOS">Activos</MenuItem>
                <MenuItem value="INACTIVOS">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={pageCardSx()}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box py={10} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : filteredUsuarios.length === 0 ? (
            <Box py={10} textAlign="center">
              <ManageAccountsRoundedIcon
                sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="h6" fontWeight={800}>
                No hay usuarios para mostrar
              </Typography>
              <Typography color="text.secondary">
                Ajusta filtros o da de alta el primer usuario.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 6 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell>Seguridad</TableCell>
                    <TableCell>Creado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsuarios.map((usuario) => {
                    const displayName = getDisplayName(usuario);
                    const role = getPrimaryRole(usuario);

                    return (
                      <TableRow key={usuario.id} hover>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography fontWeight={800}>{displayName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {usuario.id}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>{usuario.email}</TableCell>

                        <TableCell>
                          {role ? (
                            <Chip
                              size="small"
                              label={role}
                              color={role === "ADMIN" ? "primary" : "default"}
                              variant={role === "ADMIN" ? "filled" : "outlined"}
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
                            label={usuario.activo ? "ACTIVO" : "INACTIVO"}
                            color={usuario.activo ? "success" : "default"}
                            variant={usuario.activo ? "filled" : "outlined"}
                          />
                        </TableCell>

                        <TableCell>
                          {usuario.mustChangePassword ? (
                            <Chip
                              size="small"
                              icon={<LockResetRoundedIcon />}
                              label="Cambio requerido"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              icon={<ShieldRoundedIcon />}
                              label="Normal"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </TableCell>

                        <TableCell>{formatDateTime(usuario.createdAtUtc)}</TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Tooltip title="Editar usuario">
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditRoundedIcon />}
                                  onClick={() => openEditDialog(usuario)}
                                  disabled={saving || processingId === usuario.id}
                                >
                                  Editar
                                </Button>
                              </span>
                            </Tooltip>

                            <Tooltip
                              title={
                                usuario.activo
                                  ? "Desactivar usuario"
                                  : "Activar usuario"
                              }
                            >
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color={usuario.activo ? "inherit" : "success"}
                                  onClick={() => void handleToggleActivo(usuario)}
                                  disabled={saving || processingId === usuario.id}
                                >
                                  {processingId === usuario.id
                                    ? "Procesando..."
                                    : usuario.activo
                                    ? "Desactivar"
                                    : "Activar"}
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingUsuario ? "Editar usuario" : "Nuevo usuario"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            <TextField
              label="Correo"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
            />

            <FormControl error={Boolean(errors.role)} fullWidth>
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

              {errors.role ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.75 }}>
                  {errors.role}
                </Typography>
              ) : null}
            </FormControl>

            {!editingUsuario ? (
              <>
                <TextField
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  fullWidth
                />

                <TextField
                  label="Confirmar contraseña"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  fullWidth
                />
              </>
            ) : null}

            <FormControlLabel
              control={
                <Switch
                  checked={form.activo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      activo: e.target.checked,
                    }))
                  }
                />
              }
              label="Usuario activo"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancelar
          </Button>

          <Button
            onClick={() => void handleSave()}
            variant="contained"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : editingUsuario
              ? "Guardar cambios"
              : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3800}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}