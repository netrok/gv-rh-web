import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
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
  FormControl,
  FormControlLabel,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";

import IncidenciaEvidenciaDialog from "../components/IncidenciaEvidenciaDialog";
import AppPage from "../components/ui/AppPage";
import EmptyState from "../components/ui/EmptyState";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import { useAuth } from "../features/auth/AuthContext";
import type {
  CatalogoOption,
  Incidencia,
  IncidenciaEvidencia,
  IncidenciaQuery,
  ResolverIncidenciaInput,
  SaveIncidenciaInput,
} from "../api/incidencias.api";
import {
  aprobarIncidencia,
  createIncidencia,
  downloadBlobFile,
  downloadIncidenciaEvidencia,
  exportIncidenciasPdf,
  exportIncidenciasXlsx,
  getEstatusIncidencia,
  getIncidenciaErrorMessage,
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

type FiltersState = {
  empleadoId: string;
  sucursalId: string;
  tipo: string;
  estatus: string;
  fechaDesde: string;
  fechaHasta: string;
  soloPendientes: boolean;
};

type PendingAction =
  | {
      type: "approve" | "reject";
      item: Incidencia;
    }
  | null;

type SnackbarState = {
  open: boolean;
  severity: "success" | "error" | "info" | "warning";
  message: string;
};

const initialForm: FormState = {
  empleadoId: "",
  sucursalId: "",
  tipo: "",
  fechaInicio: "",
  fechaFin: "",
  comentario: "",
};

const initialFilters: FiltersState = {
  empleadoId: "",
  sucursalId: "",
  tipo: "",
  estatus: "",
  fechaDesde: "",
  fechaHasta: "",
  soloPendientes: false,
};

const DEFAULT_TIPOS: CatalogoOption[] = [
  { id: 1, clave: "FALTA", nombre: "FALTA" },
  { id: 2, clave: "RETARDO", nombre: "RETARDO" },
  { id: 3, clave: "PERMISO", nombre: "PERMISO" },
  { id: 4, clave: "VACACIONES", nombre: "VACACIONES" },
  { id: 5, clave: "INCAPACIDAD", nombre: "INCAPACIDAD" },
  { id: 6, clave: "OMISION_CHECADA", nombre: "OMISIÓN DE CHECADA" },
];

const DEFAULT_ESTATUS: CatalogoOption[] = [
  { id: 1, clave: "PENDIENTE", nombre: "PENDIENTE" },
  { id: 2, clave: "APROBADA", nombre: "APROBADA" },
  { id: 3, clave: "RECHAZADA", nombre: "RECHAZADA" },
];

function normalizeEnumValue(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeRoles(roles?: string[] | null): string[] {
  return (roles ?? []).map((role) => String(role).trim().toUpperCase());
}

function hasSomeRole(
  userRoles: string[] | null | undefined,
  allowed: string[]
): boolean {
  const normalizedUserRoles = normalizeRoles(userRoles);
  const normalizedAllowed = normalizeRoles(allowed);
  return normalizedAllowed.some((role) => normalizedUserRoles.includes(role));
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

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function tipoChipSx(tipo: string | number) {
  const normalized = normalizeEnumValue(tipo);

  if (normalized === "FALTA" || normalized === "1") {
    return {
      bgcolor: "rgba(211, 47, 47, 0.08)",
      color: "error.main",
      borderColor: "rgba(211, 47, 47, 0.28)",
      fontWeight: 800,
    };
  }

  if (normalized === "RETARDO" || normalized === "2") {
    return {
      bgcolor: "rgba(237, 108, 2, 0.08)",
      color: "warning.main",
      borderColor: "rgba(237, 108, 2, 0.28)",
      fontWeight: 800,
    };
  }

  if (normalized === "PERMISO" || normalized === "3") {
    return {
      bgcolor: "rgba(2, 136, 209, 0.08)",
      color: "info.main",
      borderColor: "rgba(2, 136, 209, 0.28)",
      fontWeight: 800,
    };
  }

  if (normalized === "VACACIONES" || normalized === "4") {
    return {
      bgcolor: "rgba(46, 125, 50, 0.08)",
      color: "success.main",
      borderColor: "rgba(46, 125, 50, 0.28)",
      fontWeight: 800,
    };
  }

  if (normalized === "INCAPACIDAD" || normalized === "5") {
    return {
      bgcolor: "rgba(156, 39, 176, 0.08)",
      color: "secondary.main",
      borderColor: "rgba(156, 39, 176, 0.28)",
      fontWeight: 800,
    };
  }

  return {
    bgcolor: "rgba(0, 0, 0, 0.04)",
    color: "text.primary",
    borderColor: "divider",
    fontWeight: 800,
  };
}

function estatusChipSx(estatus: string | number) {
  const normalized = normalizeEnumValue(estatus);

  if (normalized === "1" || normalized === "PENDIENTE") {
    return {
      bgcolor: "rgba(237, 108, 2, 0.10)",
      color: "warning.dark",
      borderColor: "rgba(237, 108, 2, 0.34)",
      fontWeight: 800,
    };
  }

  if (normalized === "2" || normalized === "APROBADA") {
    return {
      bgcolor: "rgba(46, 125, 50, 0.10)",
      color: "success.dark",
      borderColor: "rgba(46, 125, 50, 0.34)",
      fontWeight: 800,
    };
  }

  if (normalized === "3" || normalized === "RECHAZADA") {
    return {
      bgcolor: "rgba(211, 47, 47, 0.10)",
      color: "error.dark",
      borderColor: "rgba(211, 47, 47, 0.34)",
      fontWeight: 800,
    };
  }

  return {
    bgcolor: "rgba(0, 0, 0, 0.04)",
    color: "text.primary",
    borderColor: "divider",
    fontWeight: 800,
  };
}

function tableActionIconSx(tone: "primary" | "success" | "error" = "primary") {
  if (tone === "success") {
    return {
      width: 34,
      height: 34,
      borderRadius: "10px",
      border: "1px solid",
      borderColor: (theme: any) => alpha(theme.palette.success.main, 0.24),
      bgcolor: (theme: any) => alpha(theme.palette.success.main, 0.08),
      color: "success.dark",
      "&:hover": {
        bgcolor: (theme: any) => alpha(theme.palette.success.main, 0.16),
        borderColor: (theme: any) => alpha(theme.palette.success.main, 0.36),
      },
    };
  }

  if (tone === "error") {
    return {
      width: 34,
      height: 34,
      borderRadius: "10px",
      border: "1px solid",
      borderColor: (theme: any) => alpha(theme.palette.error.main, 0.24),
      bgcolor: (theme: any) => alpha(theme.palette.error.main, 0.06),
      color: "error.dark",
      "&:hover": {
        bgcolor: (theme: any) => alpha(theme.palette.error.main, 0.12),
        borderColor: (theme: any) => alpha(theme.palette.error.main, 0.36),
      },
    };
  }

  return {
    width: 34,
    height: 34,
    borderRadius: "10px",
    border: "1px solid",
    borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.18),
    bgcolor: (theme: any) => alpha(theme.palette.primary.main, 0.05),
    color: "primary.main",
    "&:hover": {
      bgcolor: (theme: any) => alpha(theme.palette.primary.main, 0.10),
      borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.30),
    },
  };
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

  if (kind === "image") return <ImageRoundedIcon fontSize="small" />;
  if (kind === "pdf") return <PictureAsPdfRoundedIcon fontSize="small" />;

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

function normalizeIncidenciasResponse(data: unknown): Incidencia[] {
  if (Array.isArray(data)) return data;

  const typed = data as { items?: unknown };
  if (Array.isArray(typed?.items)) {
    return typed.items as Incidencia[];
  }

  return [];
}

export default function IncidenciasPage() {
  const { roles: userRoles } = useAuth();

  const [items, setItems] = useState<Incidencia[]>([]);
  const [tipos, setTipos] = useState<CatalogoOption[]>(DEFAULT_TIPOS);
  const [estatuses, setEstatuses] = useState<CatalogoOption[]>(DEFAULT_ESTATUS);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [sucursales, setSucursales] = useState<SucursalLite[]>([]);

  const [bootstrapping, setBootstrapping] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Incidencia | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [evidenciaOpen, setEvidenciaOpen] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(
    null
  );

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [resolutionComment, setResolutionComment] = useState("");

  const [filters, setFilters] = useState<FiltersState>(initialFilters);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const normalizedRoles = useMemo(() => normalizeRoles(userRoles), [userRoles]);

  const canViewIncidencias = hasSomeRole(userRoles, [
    "ADMIN",
    "RRHH",
    "JEFE",
    "EMPLEADO",
  ]);
  const canManageIncidencias = hasSomeRole(userRoles, ["ADMIN", "RRHH"]);
  const canApproveReject = hasSomeRole(userRoles, ["ADMIN", "RRHH", "JEFE"]);
  const canExport = hasSomeRole(userRoles, ["ADMIN", "RRHH"]);
  const canManageEvidence = hasSomeRole(userRoles, ["ADMIN", "RRHH"]);
  const canDownloadEvidence = canViewIncidencias;

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
      (x) =>
        normalizeEnumValue(x.estatus) === "APROBADA" ||
        normalizeEnumValue(x.estatus) === "2"
    ).length;
    const conEvidencia = items.filter((x) => x.tieneEvidencia).length;

    return {
      total: items.length,
      pendientes,
      aprobadas,
      conEvidencia,
    };
  }, [items]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total",
        value: summary.total,
        subtitle: "Incidencias visibles",
        icon: <PeopleAltRoundedIcon fontSize="small" />,
      },
      {
        title: "Pendientes",
        value: summary.pendientes,
        subtitle: "Esperando revisión",
        icon: <PendingActionsRoundedIcon fontSize="small" />,
      },
      {
        title: "Aprobadas",
        value: summary.aprobadas,
        subtitle: "Ya resueltas",
        icon: <TaskAltRoundedIcon fontSize="small" />,
      },
      {
        title: "Con evidencia",
        value: summary.conEvidencia,
        subtitle: "Con archivo adjunto",
        icon: <DescriptionRoundedIcon fontSize="small" />,
      },
    ],
    [summary]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.empleadoId) count += 1;
    if (filters.sucursalId) count += 1;
    if (filters.tipo) count += 1;
    if (filters.estatus) count += 1;
    if (filters.fechaDesde) count += 1;
    if (filters.fechaHasta) count += 1;
    if (filters.soloPendientes) count += 1;
    return count;
  }, [filters]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const refreshBusy = loadingList && !bootstrapping;
  const exportBusy = exportingXlsx || exportingPdf;
  const mutationBusy = saving || confirmLoading || !!pendingAction;
  const toolbarBusy = bootstrapping || mutationBusy || exportBusy;

  function notify(severity: SnackbarState["severity"], message: string) {
    setSnackbar({ open: true, severity, message });
  }

  function closeSnackbar() {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }

  function handleChangePage(_event: unknown, newPage: number) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  }

  function buildQueryFromFilters(currentFilters = filters): IncidenciaQuery {
    const tipoSeleccionado = currentFilters.tipo
      ? findCatalogOption(currentFilters.tipo, tipos)
      : undefined;

    const estatusSeleccionado = currentFilters.estatus
      ? findCatalogOption(currentFilters.estatus, estatuses)
      : undefined;

    return {
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
  }

  async function loadCatalogs() {
    if (!canViewIncidencias) return;

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
    } else if (tiposResult.status === "rejected") {
      console.error("Error cargando tipos de incidencia:", tiposResult.reason);
    }

    if (
      estatusResult.status === "fulfilled" &&
      Array.isArray(estatusResult.value)
    ) {
      setEstatuses(estatusResult.value);
    } else if (estatusResult.status === "rejected") {
      console.error("Error cargando estatus de incidencia:", estatusResult.reason);
    }

    if (empleadosResult.status === "fulfilled") {
      const empleadosData = empleadosResult.value as unknown;
      const empleadosList = Array.isArray(empleadosData)
        ? (empleadosData as Empleado[])
        : Array.isArray((empleadosData as { items?: unknown[] })?.items)
        ? ((empleadosData as { items: Empleado[] }).items ?? [])
        : [];

      setEmpleados(empleadosList);
    } else {
      console.error("Error cargando empleados:", empleadosResult.reason);
      setEmpleados([]);
    }

    if (sucursalesResult.status === "fulfilled") {
      const sucursalesData = sucursalesResult.value as unknown;
      const sucursalesList = Array.isArray(sucursalesData)
        ? (sucursalesData as SucursalLite[])
        : Array.isArray((sucursalesData as { items?: unknown[] })?.items)
        ? ((sucursalesData as { items: SucursalLite[] }).items ?? [])
        : [];

      setSucursales(sucursalesList);
    } else {
      console.error("Error cargando sucursales:", sucursalesResult.reason);
      setSucursales([]);
    }
  }

  async function loadItems(currentFilters = filters) {
    if (!canViewIncidencias) return;

    setLoadingList(true);

    try {
      const query = buildQueryFromFilters(currentFilters);
      const data = await getIncidencias(query);
      setItems(normalizeIncidenciasResponse(data));
    } catch (error) {
      console.error("Error cargando incidencias:", error);
      notify(
        "error",
        getIncidenciaErrorMessage(
          error,
          "No se pudieron cargar las incidencias."
        )
      );
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!canViewIncidencias) {
        setBootstrapping(false);
        setItems([]);
        setEmpleados([]);
        setSucursales([]);
        return;
      }

      setBootstrapping(true);

      try {
        await loadCatalogs();
        if (!cancelled) {
          await loadItems(initialFilters);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewIncidencias]);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  function openCreate() {
    if (!canManageIncidencias) {
      notify("warning", "No tienes permisos para crear incidencias.");
      return;
    }

    setEditing(null);
    setForm(initialForm);
    setDialogOpen(true);
  }

  function openEdit(item: Incidencia) {
    if (!canManageIncidencias) {
      notify("warning", "No tienes permisos para editar incidencias.");
      return;
    }

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
    if (!canManageEvidence) {
      notify("warning", "No tienes permisos para gestionar evidencia.");
      return;
    }

    setSelectedIncidencia(item);
    setEvidenciaOpen(true);
  }

  function handleCloseEvidencia() {
    setEvidenciaOpen(false);
    setSelectedIncidencia(null);
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
    if (!canManageIncidencias) {
      notify("warning", "No tienes permisos para guardar incidencias.");
      return;
    }

    if (!form.empleadoId || !form.tipo || !form.fechaInicio || !form.fechaFin) {
      notify("error", "Empleado, tipo y rango de fechas son obligatorios.");
      return;
    }

    if (form.fechaInicio > form.fechaFin) {
      notify("error", "La fecha fin no puede ser menor a la fecha inicio.");
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

      closeDialog();
      await loadItems(filters);
    } catch (error) {
      notify(
        "error",
        getIncidenciaErrorMessage(error, "No se pudo guardar la incidencia.")
      );
    } finally {
      setSaving(false);
    }
  }

  function requestApprove(item: Incidencia) {
    if (!canApproveReject) {
      notify("warning", "No tienes permisos para aprobar incidencias.");
      return;
    }

    setResolutionComment("");
    setPendingAction({ type: "approve", item });
  }

  function requestReject(item: Incidencia) {
    if (!canApproveReject) {
      notify("warning", "No tienes permisos para rechazar incidencias.");
      return;
    }

    setResolutionComment("");
    setPendingAction({ type: "reject", item });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    setConfirmLoading(true);

    const payload: ResolverIncidenciaInput = {
      comentario: resolutionComment.trim() || null,
    };

    try {
      if (pendingAction.type === "approve") {
        await aprobarIncidencia(pendingAction.item.id, payload);
        notify("success", "Incidencia aprobada correctamente.");
      } else {
        await rechazarIncidencia(pendingAction.item.id, payload);
        notify("success", "Incidencia rechazada correctamente.");
      }

      setPendingAction(null);
      setResolutionComment("");
      await loadItems(filters);
    } catch (error) {
      notify(
        "error",
        getIncidenciaErrorMessage(
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

  async function handleDownloadEvidence(item: Incidencia) {
    if (!canDownloadEvidence) {
      notify("warning", "No tienes permisos para descargar evidencia.");
      return;
    }

    try {
      const blob = await downloadIncidenciaEvidencia(item.id);
      const fallbackName =
        item.evidenciaNombreOriginal ||
        `incidencia-${item.id}-evidencia`;

      downloadBlobFile(blob, fallbackName);
    } catch (error) {
      notify(
        "error",
        getIncidenciaErrorMessage(
          error,
          "No se pudo descargar la evidencia."
        )
      );
    }
  }

  async function applyFilters() {
    if (!canViewIncidencias) return;

    if (
      filters.fechaDesde &&
      filters.fechaHasta &&
      filters.fechaDesde > filters.fechaHasta
    ) {
      notify("error", "La fecha hasta no puede ser menor a la fecha desde.");
      return;
    }

    await loadItems(filters);
  }

  async function clearFilters() {
    if (!canViewIncidencias) return;

    setFilters(initialFilters);
    await loadItems(initialFilters);
  }

  async function handleRefresh() {
    if (!canViewIncidencias) return;
    await loadItems(filters);
  }

  async function handleExportXlsx() {
    if (!canExport) {
      notify("warning", "No tienes permisos para exportar incidencias.");
      return;
    }

    try {
      setExportingXlsx(true);

      const query = buildQueryFromFilters(filters);
      const blob = await exportIncidenciasXlsx(query);

      downloadBlobFile(blob, "incidencias.xlsx");
      notify("success", "Excel exportado correctamente.");
    } catch (error) {
      console.error("Error exportando Excel:", error);
      notify(
        "error",
        getIncidenciaErrorMessage(
          error,
          "No se pudo exportar el Excel de incidencias."
        )
      );
    } finally {
      setExportingXlsx(false);
    }
  }

  async function handleExportPdf() {
    if (!canExport) {
      notify("warning", "No tienes permisos para exportar incidencias.");
      return;
    }

    try {
      setExportingPdf(true);

      const query = buildQueryFromFilters(filters);
      const blob = await exportIncidenciasPdf(query);

      downloadBlobFile(blob, "incidencias.pdf");
      notify("success", "PDF exportado correctamente.");
    } catch (error) {
      console.error("Error exportando PDF:", error);
      notify(
        "error",
        getIncidenciaErrorMessage(
          error,
          "No se pudo exportar el PDF de incidencias."
        )
      );
    } finally {
      setExportingPdf(false);
    }
  }

  if (!canViewIncidencias) {
    return (
      <AppPage
        eyebrow="Recursos Humanos"
        title="Incidencias"
        subtitle="Control de incidencias y asistencias con evidencia documental, filtros operativos y exportación."
      >
        <HeroBanner
          eyebrow="Módulo operativo"
          title="Seguimiento de incidencias"
          subtitle="Registra, revisa, aprueba y documenta incidencias del personal con control por estatus, fechas y evidencia adjunta."
          badge="Sin acceso"
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
                Estado del módulo
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                0
              </Typography>

              <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
                Tu rol actual no tiene acceso a este módulo.
              </Typography>
            </Stack>
          }
        />

        <Alert severity="warning">
          Tu usuario no tiene permisos para consultar o gestionar incidencias.
          Si necesitas acceso, solicita la asignación del rol correspondiente.
        </Alert>
      </AppPage>
    );
  }

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Incidencias"
      subtitle="Control de incidencias y asistencias con evidencia documental, filtros operativos y exportación."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={refreshBusy ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshBusy || mutationBusy || exportBusy}
          >
            {refreshBusy ? "Actualizando..." : "Actualizar"}
          </Button>

          {canExport && (
            <Button
              variant="outlined"
              startIcon={
                exportingXlsx ? (
                  <CircularProgress size={18} />
                ) : (
                  <DescriptionRoundedIcon />
                )
              }
              onClick={handleExportXlsx}
              disabled={toolbarBusy}
            >
              {exportingXlsx ? "Exportando Excel..." : "Exportar Excel"}
            </Button>
          )}

          {canExport && (
            <Button
              variant="outlined"
              startIcon={
                exportingPdf ? (
                  <CircularProgress size={18} />
                ) : (
                  <PictureAsPdfRoundedIcon />
                )
              }
              onClick={handleExportPdf}
              disabled={toolbarBusy}
            >
              {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
            </Button>
          )}

          {canManageIncidencias && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              disabled={toolbarBusy || refreshBusy}
            >
              Nueva incidencia
            </Button>
          )}
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Módulo operativo"
        title="Seguimiento de incidencias"
        subtitle="Registra, revisa, aprueba y documenta incidencias del personal con control por estatus, fechas y evidencia adjunta."
        badge={
          canManageIncidencias
            ? "Gestión habilitada"
            : canApproveReject
            ? "Aprobación habilitada"
            : "Consulta"
        }
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

            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {summary.total}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  visibles
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {summary.pendientes}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.8) }}>
                  pendientes
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
              {canExport
                ? "Exportación habilitada para tu sesión actual."
                : canApproveReject
                ? "Puedes revisar y resolver incidencias según tu jerarquía."
                : "Consulta disponible según tu rol actual."}
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
        {summaryCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
          />
        ))}
      </Box>

      <SectionCard
        title="Filtros"
        subtitle="Refina el listado por empleado, sucursal, tipo, estatus o fechas."
        actions={
          <Chip
            size="small"
            variant="outlined"
            color={activeFiltersCount > 0 ? "primary" : undefined}
            label={
              activeFiltersCount > 0
                ? `${activeFiltersCount} filtro${
                    activeFiltersCount > 1 ? "s" : ""
                  } activo${activeFiltersCount > 1 ? "s" : ""}`
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
              fullWidth
              label="Fecha desde"
              type="date"
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
              fullWidth
              label="Fecha hasta"
              type="date"
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
              <Button
                variant="contained"
                onClick={applyFilters}
                disabled={loadingList || mutationBusy || exportBusy}
                startIcon={loadingList ? <CircularProgress size={18} /> : undefined}
              >
                {loadingList ? "Aplicando..." : "Aplicar filtros"}
              </Button>

              <Button
                variant="outlined"
                onClick={clearFilters}
                disabled={loadingList || mutationBusy || exportBusy}
              >
                Limpiar
              </Button>
            </Stack>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Listado"
        subtitle="Revisa estatus, evidencia y acciones disponibles por incidencia."
        actions={
          <Chip
            label={`${paginatedItems.length} visibles de ${items.length}`}
            size="small"
            variant="outlined"
          />
        }
      >
        {bootstrapping || loadingList ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<PendingActionsRoundedIcon sx={{ fontSize: 52 }} />}
            title="No hay incidencias para mostrar"
            description="No se encontraron registros con los filtros actuales. Ajusta la búsqueda o registra una nueva incidencia."
            actionLabel={canManageIncidencias ? "Nueva incidencia" : undefined}
            onAction={canManageIncidencias ? openCreate : undefined}
          />
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 560 }}>
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
                  {paginatedItems.map((item) => {
                    const isPendiente = isPendienteValue(item.estatus);
                    const isThisPendingRow =
                      pendingAction?.item.id === item.id && confirmLoading;

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

                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={getTipoNombre(item.tipo, tipos)}
                            sx={tipoChipSx(item.tipo)}
                          />
                        </TableCell>

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
                          <Stack spacing={0.5}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={getEstatusNombre(item.estatus, estatuses)}
                              sx={estatusChipSx(item.estatus)}
                            />
                            {item.fechaResolucionUtc ? (
                              <Typography variant="caption" color="text.secondary">
                                Resuelta: {formatDateTime(item.fechaResolucionUtc)}
                              </Typography>
                            ) : null}
                          </Stack>
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
                                sx={{
                                  maxWidth: 220,
                                  width: "fit-content",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: "14px",
                                  px: 1,
                                  py: 0.75,
                                  bgcolor: "action.hover",
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: "10px",
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
                          {item.comentarioResolucion ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              Resolución: {item.comentarioResolucion}
                            </Typography>
                          ) : null}
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {item.tieneEvidencia && canDownloadEvidence && (
                              <Tooltip title="Descargar evidencia" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => void handleDownloadEvidence(item)}
                                    sx={tableActionIconSx("primary")}
                                  >
                                    <DownloadRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {canManageEvidence && (
                              <Tooltip
                                title={
                                  item.tieneEvidencia
                                    ? "Gestionar evidencia"
                                    : "Subir evidencia"
                                }
                                arrow
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEvidencia(item)}
                                    sx={tableActionIconSx("primary")}
                                  >
                                    <AttachFileRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {canManageIncidencias && (
                              <Tooltip title="Editar" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openEdit(item)}
                                    disabled={!isPendiente || isThisPendingRow}
                                    sx={tableActionIconSx("primary")}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {canApproveReject && (
                              <Tooltip title="Aprobar" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => requestApprove(item)}
                                    disabled={!isPendiente || confirmLoading}
                                    sx={tableActionIconSx("success")}
                                  >
                                    {isThisPendingRow &&
                                    pendingAction?.type === "approve" ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <CheckCircleOutlineIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {canApproveReject && (
                              <Tooltip title="Rechazar" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => requestReject(item)}
                                    disabled={!isPendiente || confirmLoading}
                                    sx={tableActionIconSx("error")}
                                  >
                                    {isThisPendingRow &&
                                    pendingAction?.type === "reject" ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <CloseIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
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
              count={items.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </SectionCard>

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
                fullWidth
                label="Fecha inicio"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fechaInicio}
                onChange={(e) => updateForm("fechaInicio", e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
              <TextField
                fullWidth
                label="Fecha fin"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fechaFin}
                onChange={(e) => updateForm("fechaFin", e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "span 1", md: "span 12" } }}>
              <TextField
                fullWidth
                label="Comentario"
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
            {saving
              ? "Guardando..."
              : editing
              ? "Guardar cambios"
              : "Crear incidencia"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!pendingAction}
        onClose={() => {
          if (!confirmLoading) {
            setPendingAction(null);
            setResolutionComment("");
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {pendingAction?.type === "approve"
            ? "Aprobar incidencia"
            : "Rechazar incidencia"}
        </DialogTitle>

        <DialogContent dividers>
          {pendingAction ? (
            <Stack spacing={2}>
              <Alert severity={pendingAction.type === "approve" ? "success" : "warning"}>
                Vas a{" "}
                {pendingAction.type === "approve" ? "aprobar" : "rechazar"} la
                incidencia #{pendingAction.item.id} de{" "}
                <strong>{pendingAction.item.empleadoNombre}</strong>.
              </Alert>

              <TextField
                fullWidth
                label="Comentario de resolución"
                multiline
                minRows={3}
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Opcional"
              />
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              if (!confirmLoading) {
                setPendingAction(null);
                setResolutionComment("");
              }
            }}
            disabled={confirmLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={pendingAction?.type === "approve" ? "success" : "error"}
            disabled={confirmLoading}
          >
            {confirmLoading
              ? "Procesando..."
              : pendingAction?.type === "approve"
              ? "Aprobar"
              : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>

      <IncidenciaEvidenciaDialog
        open={evidenciaOpen}
        incidencia={selectedIncidencia}
        onClose={handleCloseEvidencia}
        onChanged={handleEvidenciaChanged}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppPage>
  );
}