import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Divider,
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";

import IncidenciaEvidenciaDialog from "../components/IncidenciaEvidenciaDialog";
import ConfirmActionDialog from "../components/ui/ConfirmActionDialog";
import type {
  CatalogoOption,
  Incidencia,
  IncidenciaEvidencia,
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

type PendingAction =
  | {
      type: "approve" | "reject";
      item: Incidencia;
    }
  | null;

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

function normalizeEnumValue(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function formatEnumLabel(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "—";

  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatBytes(value?: number | null): string {
  if (!value || value <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function findCatalogOption(
  value: string | number | null | undefined,
  options: CatalogoOption[]
): CatalogoOption | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const normalizedString = normalizeEnumValue(value);
  const numericValue = Number(value);

  return options.find(
    (x) =>
      x.id === numericValue ||
      normalizeEnumValue(x.clave) === normalizedString ||
      normalizeEnumValue(x.nombre) === normalizedString
  );
}

function getCatalogSelectValue(
  value: string | number | null | undefined,
  options: CatalogoOption[]
): string {
  const match = findCatalogOption(value, options);
  return match ? String(match.id) : value ? String(value) : "";
}

function getTipoNombre(tipo: string | number, tipos: CatalogoOption[]): string {
  return findCatalogOption(tipo, tipos)?.nombre ?? formatEnumLabel(tipo);
}

function getEstatusNombre(
  estatus: string | number,
  estatuses: CatalogoOption[]
): string {
  return findCatalogOption(estatus, estatuses)?.nombre ?? formatEnumLabel(estatus);
}

function estatusChipColor(
  estatus: string | number
): "default" | "warning" | "success" | "error" {
  const normalized = normalizeEnumValue(estatus);

  if (normalized === "1" || normalized === "PENDIENTE") return "warning";
  if (normalized === "2" || normalized === "APROBADA") return "success";
  if (normalized === "3" || normalized === "RECHAZADA") return "error";
  return "default";
}

function isPendienteValue(estatus: string | number): boolean {
  const normalized = normalizeEnumValue(estatus);
  return normalized === "1" || normalized === "PENDIENTE";
}

function getEvidenceKind(item: Incidencia): "image" | "pdf" | "file" {
  const contentType = (item.evidenciaContentType ?? "").toLowerCase();
  const fileName = (item.evidenciaNombreOriginal ?? "").toLowerCase();

  if (
    contentType.startsWith("image/") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp")
  ) {
    return "image";
  }

  if (contentType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  return "file";
}

function getEvidenceIcon(item: Incidencia): ReactNode {
  const kind = getEvidenceKind(item);

  if (kind === "image") {
    return <ImageRoundedIcon fontSize="small" />;
  }

  if (kind === "pdf") {
    return <PictureAsPdfRoundedIcon fontSize="small" />;
  }

  return <InsertDriveFileRoundedIcon fontSize="small" />;
}

function toForm(item: Incidencia, tipos: CatalogoOption[]): FormState {
  return {
    empleadoId: String(item.empleadoId),
    sucursalId: item.sucursalId ? String(item.sucursalId) : "",
    tipo: getCatalogSelectValue(item.tipo, tipos),
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

type SummaryCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
};

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
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
      </CardContent>
    </Card>
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
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Incidencia | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [evidenciaOpen, setEvidenciaOpen] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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

  const summary = useMemo(() => {
    const pendientes = items.filter((x) => isPendienteValue(x.estatus)).length;
    const aprobadas = items.filter(
      (x) => normalizeEnumValue(x.estatus) === "APROBADA"
    ).length;
    const conEvidencia = items.filter((x) => x.tieneEvidencia).length;

    return {
      total: items.length,
      pendientes,
      aprobadas,
      conEvidencia,
    };
  }, [items]);

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
      const tipoSeleccionado = currentFilters.tipo
        ? findCatalogOption(currentFilters.tipo, tipos)
        : undefined;

      const estatusSeleccionado = currentFilters.estatus
        ? findCatalogOption(currentFilters.estatus, estatuses)
        : undefined;

      const query: IncidenciaQuery = {
        empleadoId: currentFilters.empleadoId
          ? Number(currentFilters.empleadoId)
          : undefined,
        sucursalId: currentFilters.sucursalId
          ? Number(currentFilters.sucursalId)
          : undefined,
        tipo: tipoSeleccionado?.clave ?? undefined,
        estatus: estatusSeleccionado?.clave ?? undefined,
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
    setForm(toForm(item, tipos));
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

  function handleOpenEvidencia(item: Incidencia) {
    setSelectedIncidencia(item);
    setEvidenciaOpen(true);
  }

  function handleEvidenciaChanged(payload: {
    incidenciaId: number;
    evidencia: IncidenciaEvidencia | null;
  }) {
    setItems((prev) =>
      prev.map((item) =>
        item.id !== payload.incidenciaId
          ? item
          : {
              ...item,
              tieneEvidencia: !!payload.evidencia,
              evidenciaNombreOriginal:
                payload.evidencia?.evidenciaNombreOriginal ?? null,
              evidenciaContentType:
                payload.evidencia?.evidenciaContentType ?? null,
              evidenciaTamanoBytes:
                payload.evidencia?.evidenciaTamanoBytes ?? null,
            }
      )
    );

    setSelectedIncidencia((prev) =>
      prev && prev.id === payload.incidenciaId
        ? {
            ...prev,
            tieneEvidencia: !!payload.evidencia,
            evidenciaNombreOriginal:
              payload.evidencia?.evidenciaNombreOriginal ?? null,
            evidenciaContentType:
              payload.evidencia?.evidenciaContentType ?? null,
            evidenciaTamanoBytes:
              payload.evidencia?.evidenciaTamanoBytes ?? null,
          }
        : prev
    );
  }

  async function handleSave() {
    if (!form.empleadoId || !form.tipo || !form.fechaInicio || !form.fechaFin) {
      notify("error", "Empleado, tipo y rango de fechas son obligatorios.");
      return;
    }

    const tipoSeleccionado = findCatalogOption(form.tipo, tipos);

    const payload: SaveIncidenciaInput = {
      empleadoId: Number(form.empleadoId),
      sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
      tipo: tipoSeleccionado?.clave ?? form.tipo,
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

  function requestApprove(item: Incidencia) {
    setPendingAction({ type: "approve", item });
  }

  function requestReject(item: Incidencia) {
    setPendingAction({ type: "reject", item });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    setConfirmLoading(true);

    try {
      if (pendingAction.type === "approve") {
        await aprobarIncidencia(pendingAction.item.id);
        notify("success", "Incidencia aprobada correctamente.");
      } else {
        await rechazarIncidencia(pendingAction.item.id);
        notify("success", "Incidencia rechazada correctamente.");
      }

      setPendingAction(null);
      await loadItems();
    } catch (error: any) {
      notify(
        "error",
        getErrorMessage(
          error,
          pendingAction.type === "approve"
            ? "No se pudo aprobar la incidencia."
            : "No se pudo rechazar la incidencia."
        )
      );
    } finally {
      setConfirmLoading(false);
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
    <Box sx={{ display: "grid", gap: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Incidencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control de incidencias y asistencias con evidencia documental.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadItems()}
          >
            Recargar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva incidencia
          </Button>
        </Stack>
      </Stack>

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
        <SummaryCard
          title="Total"
          value={summary.total}
          subtitle="Incidencias visibles"
          icon={<PeopleAltRoundedIcon fontSize="small" />}
        />
        <SummaryCard
          title="Pendientes"
          value={summary.pendientes}
          subtitle="Esperando revisión"
          icon={<PendingActionsRoundedIcon fontSize="small" />}
        />
        <SummaryCard
          title="Aprobadas"
          value={summary.aprobadas}
          subtitle="Ya resueltas"
          icon={<TaskAltRoundedIcon fontSize="small" />}
        />
        <SummaryCard
          title="Con evidencia"
          value={summary.conEvidencia}
          subtitle="Con archivo adjunto"
          icon={<DescriptionRoundedIcon fontSize="small" />}
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
                Refina el listado por empleado, sucursal, tipo, estatus o fechas.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

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

            <Box
              sx={{
                gridColumn: { xs: "span 1", md: "span 2" },
                display: "flex",
                alignItems: "center",
              }}
            >
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
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Listado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisa estatus, evidencia y acciones disponibles por incidencia.
              </Typography>
            </Box>

            <Chip label={`${items.length} registros`} size="small" variant="outlined" />
          </Stack>

          <Divider sx={{ mb: 2 }} />

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
                    <TableCell>Periodo</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell>Evidencia</TableCell>
                    <TableCell>Comentario</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => {
                    const isPendiente = isPendienteValue(item.estatus);

                    return (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{
                          backgroundColor: isPendiente
                            ? "rgba(255, 244, 229, 0.35)"
                            : "transparent",
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={700}>#{item.id}</Typography>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography fontWeight={600}>
                              {item.empleadoNombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Empleado #{item.empleadoId}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>{item.sucursalNombre ?? "—"}</TableCell>

                        <TableCell>{getTipoNombre(item.tipo, tipos)}</TableCell>

                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              Inicio: {formatDate(item.fechaInicio)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Fin: {formatDate(item.fechaFin)}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={getEstatusNombre(item.estatus, estatuses)}
                            color={estatusChipColor(item.estatus)}
                          />
                        </TableCell>

                        <TableCell>
                          {item.tieneEvidencia ? (
                            <Tooltip
                              arrow
                              title={
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    {item.evidenciaNombreOriginal || "Archivo adjunto"}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Tipo: {item.evidenciaContentType || "No disponible"}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Tamaño: {formatBytes(item.evidenciaTamanoBytes)}
                                  </Typography>
                                </Box>
                              }
                            >
                              <Box
                                onClick={() => handleOpenEvidencia(item)}
                                sx={{
                                  maxWidth: 220,
                                  width: "fit-content",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 2,
                                  px: 1,
                                  py: 0.75,
                                  bgcolor: "success.50",
                                  cursor: "pointer",
                                  transition: "all .15s ease",
                                  "&:hover": {
                                    borderColor: "success.main",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                                  },
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 1.5,
                                      display: "grid",
                                      placeItems: "center",
                                      bgcolor: "background.paper",
                                      color: "success.main",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getEvidenceIcon(item)}
                                  </Box>

                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight={700}
                                      display="block"
                                    >
                                      Con evidencia
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: "block",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 150,
                                      }}
                                    >
                                      {item.evidenciaNombreOriginal || "Archivo"}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Chip size="small" variant="outlined" label="Sin evidencia" />
                          )}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.comentario || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AttachFileRoundedIcon />}
                              onClick={() => handleOpenEvidencia(item)}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              {item.tieneEvidencia
                                ? "Gestionar evidencia"
                                : "Subir evidencia"}
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => openEdit(item)}
                              disabled={!isPendiente}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Editar
                            </Button>

                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              startIcon={<CheckCircleOutlineIcon />}
                              onClick={() => requestApprove(item)}
                              disabled={!isPendiente}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Aprobar
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<CloseIcon />}
                              onClick={() => requestReject(item)}
                              disabled={!isPendiente}
                              sx={{ textTransform: "none", fontWeight: 700 }}
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

      <IncidenciaEvidenciaDialog
        open={evidenciaOpen}
        incidencia={selectedIncidencia}
        onClose={() => setEvidenciaOpen(false)}
        onChanged={handleEvidenciaChanged}
      />

      <ConfirmActionDialog
        open={!!pendingAction}
        title={
          pendingAction?.type === "approve"
            ? "Aprobar incidencia"
            : "Rechazar incidencia"
        }
        message={
          pendingAction
            ? `Vas a ${
                pendingAction.type === "approve" ? "aprobar" : "rechazar"
              } la incidencia #${pendingAction.item.id} de ${
                pendingAction.item.empleadoNombre
              }. Esta acción cambiará su estatus.`
            : ""
        }
        confirmText={pendingAction?.type === "approve" ? "Aprobar" : "Rechazar"}
        confirmColor={pendingAction?.type === "approve" ? "success" : "error"}
        loading={confirmLoading}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />

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