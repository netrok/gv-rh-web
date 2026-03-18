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
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

import type {
  CatalogoOption,
  Incidencia,
  IncidenciaQuery,
  SaveIncidenciaInput,
} from "../api/incidencias.api";
import {
  aprobarIncidencia,
  createIncidencia,
  getEstatusIncidencia,
  getIncidencias,
  getTiposIncidencia,
  rechazarIncidencia,
  updateIncidencia,
} from "../api/incidencias.api";
import { getEmpleados, type Empleado } from "../api/empleados.api";
import { getSucursales } from "../api/sucursales.api";

type SucursalLite = {
  id: number;
  nombre: string;
};

type FormState = {
  empleadoId: string;
  sucursalId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  comentario: string;
};

const initialForm: FormState = {
  empleadoId: "",
  sucursalId: "",
  tipo: "",
  fechaInicio: "",
  fechaFin: "",
  comentario: "",
};

const DEFAULT_TIPOS: CatalogoOption[] = [
  { id: 1, clave: "FALTA", nombre: "FALTA" },
  { id: 2, clave: "RETARDO", nombre: "RETARDO" },
  { id: 3, clave: "PERMISO", nombre: "PERMISO" },
  { id: 4, clave: "VACACIONES", nombre: "VACACIONES" },
  { id: 5, clave: "INCAPACIDAD", nombre: "INCAPACIDAD" },
  { id: 6, clave: "OMISION_DE_CHECADA", nombre: "OMISION DE CHECADA" },
];

const DEFAULT_ESTATUS: CatalogoOption[] = [
  { id: 1, clave: "PENDIENTE", nombre: "PENDIENTE" },
  { id: 2, clave: "APROBADA", nombre: "APROBADA" },
  { id: 3, clave: "RECHAZADA", nombre: "RECHAZADA" },
];

function getTipoNombre(tipo: number, tipos: CatalogoOption[]) {
  return tipos.find((x) => x.id === tipo)?.nombre ?? `Tipo ${tipo}`;
}

function getEstatusNombre(estatus: number, estatuses: CatalogoOption[]) {
  return estatuses.find((x) => x.id === estatus)?.nombre ?? `Estatus ${estatus}`;
}

function estatusChipColor(
  estatus: number
): "default" | "warning" | "success" | "error" {
  if (estatus === 1) return "warning";
  if (estatus === 2) return "success";
  if (estatus === 3) return "error";
  return "default";
}

function toForm(item: Incidencia): FormState {
  return {
    empleadoId: String(item.empleadoId),
    sucursalId: item.sucursalId ? String(item.sucursalId) : "",
    tipo: String(item.tipo),
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    comentario: item.comentario ?? "",
  };
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

export default function IncidenciasPage() {
  const [items, setItems] = useState<Incidencia[]>([]);
  const [tipos, setTipos] = useState<CatalogoOption[]>(DEFAULT_TIPOS);
  const [estatuses, setEstatuses] = useState<CatalogoOption[]>(DEFAULT_ESTATUS);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [sucursales, setSucursales] = useState<SucursalLite[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Incidencia | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [filters, setFilters] = useState({
    empleadoId: "",
    sucursalId: "",
    tipo: "",
    estatus: "",
    fechaDesde: "",
    fechaHasta: "",
    soloPendientes: false,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "error" | "info";
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  const empleadoOptions = useMemo(
    () =>
      empleados.map((e) => ({
        id: e.id,
        nombreCompleto: `${e.nombres} ${e.apellidoPaterno}${
          e.apellidoMaterno ? ` ${e.apellidoMaterno}` : ""
        }`.trim(),
      })),
    [empleados]
  );

  function notify(severity: "success" | "error" | "info", message: string) {
    setSnackbar({ open: true, severity, message });
  }

  async function loadCatalogs() {
    setTipos(DEFAULT_TIPOS);
    setEstatuses(DEFAULT_ESTATUS);

    const [tiposResult, estatusResult, empleadosResult, sucursalesResult] =
      await Promise.allSettled([
        getTiposIncidencia(),
        getEstatusIncidencia(),
        getEmpleados(),
        getSucursales(),
      ]);

    if (tiposResult.status === "fulfilled" && Array.isArray(tiposResult.value)) {
      setTipos(tiposResult.value);
    } else {
      console.error("Error cargando tipos de incidencia:", tiposResult);
    }

    if (
      estatusResult.status === "fulfilled" &&
      Array.isArray(estatusResult.value)
    ) {
      setEstatuses(estatusResult.value);
    } else {
      console.error("Error cargando estatus de incidencia:", estatusResult);
    }

    if (empleadosResult.status === "fulfilled") {
      const empleadosData = empleadosResult.value as any;
      setEmpleados(
        Array.isArray(empleadosData)
          ? empleadosData
          : Array.isArray(empleadosData?.items)
          ? empleadosData.items
          : []
      );
    } else {
      console.error("Error cargando empleados:", empleadosResult.reason);
      setEmpleados([]);
    }

    if (sucursalesResult.status === "fulfilled") {
      const sucursalesData = sucursalesResult.value as any;
      setSucursales(
        Array.isArray(sucursalesData)
          ? (sucursalesData as SucursalLite[])
          : Array.isArray(sucursalesData?.items)
          ? (sucursalesData.items as SucursalLite[])
          : []
      );
    } else {
      console.error("Error cargando sucursales:", sucursalesResult.reason);
      setSucursales([]);
    }
  }

  async function loadItems(currentFilters = filters) {
    setLoading(true);
    try {
      const query: IncidenciaQuery = {
        empleadoId: currentFilters.empleadoId
          ? Number(currentFilters.empleadoId)
          : undefined,
        sucursalId: currentFilters.sucursalId
          ? Number(currentFilters.sucursalId)
          : undefined,
        tipo: currentFilters.tipo ? Number(currentFilters.tipo) : undefined,
        estatus: currentFilters.estatus
          ? Number(currentFilters.estatus)
          : undefined,
        fechaDesde: currentFilters.fechaDesde || undefined,
        fechaHasta: currentFilters.fechaHasta || undefined,
        soloPendientes: currentFilters.soloPendientes || undefined,
      };

      const data = await getIncidencias(query);
      setItems(data);
    } catch (error: any) {
      console.error("Error cargando incidencias:", error);
      notify("error", getErrorMessage(error, "No se pudieron cargar las incidencias."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCatalogs();
      await loadItems();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setDialogOpen(true);
  }

  function openEdit(item: Incidencia) {
    setEditing(item);
    setForm(toForm(item));
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
    setForm(initialForm);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.empleadoId || !form.tipo || !form.fechaInicio || !form.fechaFin) {
      notify("error", "Empleado, tipo y rango de fechas son obligatorios.");
      return;
    }

    const payload: SaveIncidenciaInput = {
      empleadoId: Number(form.empleadoId),
      sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
      tipo: Number(form.tipo),
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      comentario: form.comentario?.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateIncidencia(editing.id, payload);
        notify("success", "Incidencia actualizada correctamente.");
      } else {
        await createIncidencia(payload);
        notify("success", "Incidencia creada correctamente.");
      }

      setDialogOpen(false);
      setEditing(null);
      setForm(initialForm);
      await loadItems();
    } catch (error: any) {
      notify("error", getErrorMessage(error, "No se pudo guardar la incidencia."));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(item: Incidencia) {
    try {
      await aprobarIncidencia(item.id);
      notify("success", "Incidencia aprobada correctamente.");
      await loadItems();
    } catch (error: any) {
      notify("error", getErrorMessage(error, "No se pudo aprobar la incidencia."));
    }
  }

  async function handleReject(item: Incidencia) {
    try {
      await rechazarIncidencia(item.id);
      notify("success", "Incidencia rechazada correctamente.");
      await loadItems();
    } catch (error: any) {
      notify("error", getErrorMessage(error, "No se pudo rechazar la incidencia."));
    }
  }

  async function applyFilters() {
    await loadItems(filters);
  }

  async function clearFilters() {
    const next = {
      empleadoId: "",
      sucursalId: "",
      tipo: "",
      estatus: "",
      fechaDesde: "",
      fechaHasta: "",
      soloPendientes: false,
    };
    setFilters(next);
    await loadItems(next);
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Incidencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control de incidencias y asistencias MVP.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadItems()}
          >
            Recargar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Nueva incidencia
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtros
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(12, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  label="Empleado"
                  value={filters.empleadoId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      empleadoId: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {empleadoOptions.map((e) => (
                    <MenuItem key={e.id} value={String(e.id)}>
                      {e.nombreCompleto}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  label="Sucursal"
                  value={filters.sucursalId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sucursalId: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">Todas</MenuItem>
                  {sucursales.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={filters.tipo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {tipos.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 4" } }}>
              <FormControl fullWidth>
                <InputLabel>Estatus</InputLabel>
                <Select
                  label="Estatus"
                  value={filters.estatus}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      estatus: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estatuses.map((x) => (
                    <MenuItem key={x.id} value={String(x.id)}>
                      {x.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
              <TextField
                label="Fecha desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fechaDesde}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    fechaDesde: e.target.value,
                  }))
                }
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
              <TextField
                label="Fecha hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fechaHasta}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    fechaHasta: e.target.value,
                  }))
                }
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.soloPendientes}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        soloPendientes: e.target.checked,
                      }))
                    }
                  />
                }
                label="Solo pendientes"
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 12" } }}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
                <Button variant="outlined" onClick={clearFilters}>
                  Limpiar
                </Button>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Listado
          </Typography>

          {loading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Alert severity="info">
              No hay incidencias con los filtros seleccionados.
            </Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fecha inicio</TableCell>
                    <TableCell>Fecha fin</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell>Comentario</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const isPendiente = item.estatus === 1;

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.empleadoNombre}</TableCell>
                        <TableCell>{item.sucursalNombre ?? "—"}</TableCell>
                        <TableCell>{getTipoNombre(item.tipo, tipos)}</TableCell>
                        <TableCell>{item.fechaInicio}</TableCell>
                        <TableCell>{item.fechaFin}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getEstatusNombre(item.estatus, estatuses)}
                            color={estatusChipColor(item.estatus)}
                          />
                        </TableCell>
                        <TableCell>{item.comentario || "—"}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => openEdit(item)}
                              disabled={!isPendiente}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              startIcon={<CheckCircleOutlineIcon />}
                              onClick={() => handleApprove(item)}
                              disabled={!isPendiente}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<CloseIcon />}
                              onClick={() => handleReject(item)}
                              disabled={!isPendiente}
                            >
                              Rechazar
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {editing ? `Editar incidencia #${editing.id}` : "Nueva incidencia"}
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              mt: 0.5,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(12, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box sx={{ gridColumn: { xs: "span 1", md: "span 6" } }}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  label="Empleado"
                  value={form.empleadoId}
                  onChange={(e) => updateForm("empleadoId", e.target.value)}
                >
                  {empleadoOptions.map((e) => (
                    <MenuItem key={e.id} value={String(e.id)}>
                      {e.nombreCompleto}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 6" } }}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  label="Sucursal"
                  value={form.sucursalId}
                  onChange={(e) => updateForm("sucursalId", e.target.value)}
                >
                  <MenuItem value="">Derivar del empleado</MenuItem>
                  {sucursales.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 6" } }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={form.tipo}
                  onChange={(e) => updateForm("tipo", e.target.value)}
                >
                  {tipos.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
              <TextField
                label="Fecha inicio"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.fechaInicio}
                onChange={(e) => updateForm("fechaInicio", e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
              <TextField
                label="Fecha fin"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.fechaFin}
                onChange={(e) => updateForm("fechaFin", e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 12" } }}>
              <TextField
                label="Comentario"
                fullWidth
                multiline
                minRows={3}
                value={form.comentario}
                onChange={(e) => updateForm("comentario", e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear incidencia"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}