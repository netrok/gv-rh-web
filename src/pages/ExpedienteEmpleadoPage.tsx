import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
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
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DriveFolderUploadRoundedIcon from "@mui/icons-material/DriveFolderUploadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  createEmpleadoDocumento,
  deleteEmpleadoDocumento,
  downloadEmpleadoDocumento,
  getChecklistStatusLabel,
  getChecklistStatusTone,
  getEmpleadoDocumentoBlob,
  getEmpleadoDocumentos,
  getEmpleadoDocumentosChecklist,
  getTipoDocumentoEmpleadoLabel,
  replaceEmpleadoDocumento,
  TIPOS_DOCUMENTO_EMPLEADO,
  updateEmpleadoDocumento,
  type EmpleadoDocumento,
  type EmpleadoDocumentoChecklist,
} from "../api/empleadoDocumentos.api";
import {
  getEmpleadoById,
  getEmpleadoMovimientos,
  getEmpleadoNombreCompleto,
  type Empleado,
  type EmpleadoMovimientoLaboral,
} from "../api/empleados.api";

type SnackbarState = {
  open: boolean;
  severity: "success" | "error" | "warning" | "info";
  message: string;
};

type CreateFormState = {
  tipo: number;
  fechaDocumento: string;
  fechaVencimiento: string;
  comentario: string;
  archivo: File | null;
};

type EditFormState = {
  tipo: number;
  fechaDocumento: string;
  fechaVencimiento: string;
  comentario: string;
};

type ReplaceFormState = {
  fechaDocumento: string;
  fechaVencimiento: string;
  comentario: string;
  archivo: File | null;
};

type DocumentoStatusTone = "success" | "warning" | "error" | "default";

type DocumentoStatus = {
  label: "Vigente" | "Por vencer" | "Vencido" | "Sin vencimiento";
  tone: DocumentoStatusTone;
};

type DocumentoStatusFilter = "TODOS" | DocumentoStatus["label"];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const emptyCreateForm: CreateFormState = {
  tipo: 1,
  fechaDocumento: "",
  fechaVencimiento: "",
  comentario: "",
  archivo: null,
};

const emptyEditForm: EditFormState = {
  tipo: 1,
  fechaDocumento: "",
  fechaVencimiento: "",
  comentario: "",
};

const emptyReplaceForm: ReplaceFormState = {
  fechaDocumento: "",
  fechaVencimiento: "",
  comentario: "",
  archivo: null,
};

const TIPOS_DOCUMENTO_OPTIONS = [...TIPOS_DOCUMENTO_EMPLEADO];

function formatDate(value?: string | null) {
  if (!value) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDocumentoStatus(fechaVencimiento?: string | null): DocumentoStatus {
  if (!fechaVencimiento) {
    return { label: "Sin vencimiento", tone: "default" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(`${fechaVencimiento}T00:00:00`);
  if (Number.isNaN(expiration.getTime())) {
    return { label: "Sin vencimiento", tone: "default" };
  }

  if (expiration < today) {
    return { label: "Vencido", tone: "error" };
  }

  const warningDate = new Date(today);
  warningDate.setDate(warningDate.getDate() + 30);

  if (expiration <= warningDate) {
    return { label: "Por vencer", tone: "warning" };
  }

  return { label: "Vigente", tone: "success" };
}

function getPreviewKind(mimeType?: string | null): "image" | "pdf" | "unsupported" {
  if (!mimeType) return "unsupported";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "unsupported";
}

function validateSelectedFile(file: File | null): string | null {
  if (!file) return "Debes seleccionar un archivo.";

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "El archivo excede el tamaño máximo permitido de 10 MB.";
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return "Solo se permiten archivos PDF, JPG, JPEG, PNG o WEBP.";
  }

  return null;
}

function normalizeNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMovimientoTone(
  tipo: EmpleadoMovimientoLaboral["tipoMovimiento"]
): "success" | "warning" | "info" | "default" {
  switch (tipo) {
    case "ALTA":
    case "REINGRESO":
      return "success";
    case "BAJA":
      return "warning";
    case "CAMBIO_ESTATUS":
      return "info";
    default:
      return "default";
  }
}

function getMovimientoIcon(tipo: EmpleadoMovimientoLaboral["tipoMovimiento"]) {
  switch (tipo) {
    case "ALTA":
      return <EventAvailableRoundedIcon color="success" />;
    case "REINGRESO":
      return <RestartAltRoundedIcon color="success" />;
    case "BAJA":
      return <WarningAmberRoundedIcon color="warning" />;
    default:
      return <CompareArrowsRoundedIcon color="primary" />;
  }
}

function getMovimientoLabel(tipo: EmpleadoMovimientoLaboral["tipoMovimiento"]) {
  switch (tipo) {
    case "ALTA":
      return "Alta";
    case "BAJA":
      return "Baja";
    case "REINGRESO":
      return "Reingreso";
    case "CAMBIO_PUESTO":
      return "Cambio de puesto";
    case "CAMBIO_DEPARTAMENTO":
      return "Cambio de departamento";
    case "CAMBIO_SUCURSAL":
      return "Cambio de sucursal";
    case "CAMBIO_SALARIO":
      return "Cambio de salario";
    case "CAMBIO_ESTATUS":
      return "Cambio de estatus";
    default:
      return tipo;
  }
}

function getTipoBajaLabel(tipo?: string | null) {
  switch (tipo) {
    case "VOLUNTARIA":
      return "Voluntaria";
    case "INVOLUNTARIA":
      return "Involuntaria";
    case "TERMINO_CONTRATO":
      return "Término de contrato";
    case "ABANDONO":
      return "Abandono";
    case "JUBILACION":
      return "Jubilación";
    case "DEFUNCION":
      return "Defunción";
    case "OTRA":
      return "Otra";
    default:
      return tipo ?? "—";
  }
}

function SectionPanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "24px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>

            {actions ? <Box>{actions}</Box> : null}
          </Stack>

          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "22px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
        minHeight: 134,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Box
      sx={{
        py: 5,
        px: 3,
        borderRadius: "20px",
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015),
      }}
    >
      <Stack spacing={1.25} alignItems="center">
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 520 }}
        >
          {description}
        </Typography>
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function ExpedienteEmpleadoPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { roles } = useAuth();

  const empleadoId = Number(id);

  const normalizedRoles = useMemo(
    () =>
      (roles ?? [])
        .map((role) => String(role).trim().toUpperCase())
        .filter(Boolean),
    [roles]
  );

  const canManageEmpleados =
    normalizedRoles.includes("ADMIN") || normalizedRoles.includes("RRHH");

  const backPath = canManageEmpleados ? "/empleados" : "/dashboard";
  const backLabel = canManageEmpleados
    ? "Volver a empleados"
    : "Volver a mi panel";
  const pageTitle = canManageEmpleados
    ? "Expediente digital"
    : "Mi expediente digital";
  const pageSubtitle = canManageEmpleados
    ? "Consulta documental del empleado y trazabilidad laboral."
    : "Consulta y carga de tus documentos personales.";

  const canEditDocumentoMetadata = canManageEmpleados;
  const canDeleteDocumentos = canManageEmpleados;
  const canReplaceDocumentos = true;

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [documentos, setDocumentos] = useState<EmpleadoDocumento[]>([]);
  const [checklist, setChecklist] = useState<EmpleadoDocumentoChecklist | null>(null);
  const [movimientos, setMovimientos] = useState<EmpleadoMovimientoLaboral[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [replaceForm, setReplaceForm] = useState<ReplaceFormState>(emptyReplaceForm);

  const [selectedDocumento, setSelectedDocumento] =
    useState<EmpleadoDocumento | null>(null);

  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingReplace, setSavingReplace] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<number | "TODOS">("TODOS");
  const [statusFilter, setStatusFilter] =
    useState<DocumentoStatusFilter>("TODOS");

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "info",
    message: "",
  });

  const showSnackbar = useCallback(
    (severity: SnackbarState["severity"], message: string) => {
      setSnackbar({
        open: true,
        severity,
        message,
      });
    },
    []
  );

  const loadPageData = useCallback(
    async (isRefresh = false) => {
      if (!Number.isFinite(empleadoId) || empleadoId <= 0) {
        setLoading(false);
        showSnackbar("error", "El identificador del empleado es inválido.");
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [empleadoData, documentosData, checklistData, movimientosData] =
          await Promise.all([
            getEmpleadoById(empleadoId),
            getEmpleadoDocumentos(empleadoId),
            getEmpleadoDocumentosChecklist(empleadoId),
            getEmpleadoMovimientos(empleadoId),
          ]);

        setEmpleado(empleadoData);
        setDocumentos(documentosData);
        setChecklist(checklistData);
        setMovimientos(movimientosData);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "No fue posible cargar el expediente del empleado.";
        showSnackbar("error", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [empleadoId, showSnackbar]
  );

  useEffect(() => {
    void loadPageData(false);
  }, [loadPageData]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const empleadoNombre = useMemo(() => {
    if (!empleado) return "Empleado";
    return getEmpleadoNombreCompleto(empleado);
  }, [empleado]);

  const empleadoMeta = empleado as Empleado & {
    numEmpleado?: string | null;
    sucursalNombre?: string | null;
    departamentoNombre?: string | null;
    puestoNombre?: string | null;
  };

  const documentosEnriquecidos = useMemo(() => {
    return documentos.map((item) => ({
      ...item,
      tipoLabel: getTipoDocumentoEmpleadoLabel(item.tipo),
      status: getDocumentoStatus(item.fechaVencimiento),
    }));
  }, [documentos]);

  const metrics = useMemo(() => {
    const total = documentosEnriquecidos.length;
    const vigentes = documentosEnriquecidos.filter(
      (item) => item.status.label === "Vigente"
    ).length;
    const porVencer = documentosEnriquecidos.filter(
      (item) => item.status.label === "Por vencer"
    ).length;
    const vencidos = documentosEnriquecidos.filter(
      (item) => item.status.label === "Vencido"
    ).length;

    return { total, vigentes, porVencer, vencidos };
  }, [documentosEnriquecidos]);

  const movimientosMetrics = useMemo(() => {
    const total = movimientos.length;
    const ultimo = movimientos[0] ?? null;
    const bajas = movimientos.filter((m) => m.tipoMovimiento === "BAJA").length;
    const reingresos = movimientos.filter(
      (m) => m.tipoMovimiento === "REINGRESO"
    ).length;

    return {
      total,
      ultimo,
      bajas,
      reingresos,
    };
  }, [movimientos]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documentosEnriquecidos.filter((item) => {
      const matchesTipo =
        tipoFilter === "TODOS" ? true : item.tipo === Number(tipoFilter);

      const matchesStatus =
        statusFilter === "TODOS" ? true : item.status.label === statusFilter;

      const matchesSearch =
        term.length === 0
          ? true
          : [item.nombreArchivoOriginal, item.tipoLabel, item.comentario ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(term);

      return matchesTipo && matchesStatus && matchesSearch;
    });
  }, [documentosEnriquecidos, search, tipoFilter, statusFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (tipoFilter !== "TODOS") count += 1;
    if (statusFilter !== "TODOS") count += 1;
    return count;
  }, [search, tipoFilter, statusFilter]);

  const checklistSortedItems = useMemo(() => {
    return [...(checklist?.items ?? [])]
      .map((item) => ({
        ...item,
        tipoLabel: getTipoDocumentoEmpleadoLabel(item.tipo),
      }))
      .sort((a, b) => {
        if (a.requerido !== b.requerido) {
          return a.requerido ? -1 : 1;
        }
        return a.tipo - b.tipo;
      });
  }, [checklist]);

  const handleRefresh = async () => {
    await loadPageData(true);
  };

  const handleBack = () => {
    navigate(backPath);
  };

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
  };

  const resetEditForm = () => {
    setEditForm(emptyEditForm);
    setSelectedDocumento(null);
  };

  const resetReplaceForm = () => {
    setReplaceForm(emptyReplaceForm);
    setSelectedDocumento(null);
  };

  const openUploadDialog = () => {
    resetCreateForm();
    setUploadDialogOpen(true);
  };

  const openEditDialog = (documento: EmpleadoDocumento) => {
    if (!canEditDocumentoMetadata) {
      showSnackbar("warning", "Solo RH puede editar metadatos del expediente.");
      return;
    }

    setSelectedDocumento(documento);
    setEditForm({
      tipo: documento.tipo,
      fechaDocumento: documento.fechaDocumento ?? "",
      fechaVencimiento: documento.fechaVencimiento ?? "",
      comentario: documento.comentario ?? "",
    });
    setEditDialogOpen(true);
  };

  const openReplaceDialog = (documento: EmpleadoDocumento) => {
    setSelectedDocumento(documento);
    setReplaceForm({
      fechaDocumento: documento.fechaDocumento ?? "",
      fechaVencimiento: documento.fechaVencimiento ?? "",
      comentario: documento.comentario ?? "",
      archivo: null,
    });
    setReplaceDialogOpen(true);
  };

  const openDeleteDialog = (documento: EmpleadoDocumento) => {
    if (!canDeleteDocumentos) {
      showSnackbar("warning", "Solo RH puede eliminar documentos del expediente.");
      return;
    }

    setSelectedDocumento(documento);
    setDeleteDialogOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const validateDates = (fechaDocumento: string, fechaVencimiento: string) => {
    if (!fechaDocumento || !fechaVencimiento) return null;

    const docDate = new Date(`${fechaDocumento}T00:00:00`);
    const expDate = new Date(`${fechaVencimiento}T00:00:00`);

    if (expDate < docDate) {
      return "La fecha de vencimiento no puede ser menor que la fecha del documento.";
    }

    return null;
  };

  const handleCreateSubmit = async () => {
    const fileError = validateSelectedFile(createForm.archivo);
    if (fileError) {
      showSnackbar("error", fileError);
      return;
    }

    const dateError = validateDates(
      createForm.fechaDocumento,
      createForm.fechaVencimiento
    );
    if (dateError) {
      showSnackbar("error", dateError);
      return;
    }

    try {
      setSavingCreate(true);

      await createEmpleadoDocumento(empleadoId, {
        tipo: createForm.tipo,
        archivo: createForm.archivo!,
        fechaDocumento: createForm.fechaDocumento || null,
        fechaVencimiento: createForm.fechaVencimiento || null,
        comentario: normalizeNullableText(createForm.comentario),
      });

      setUploadDialogOpen(false);
      resetCreateForm();
      showSnackbar("success", "Documento cargado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "No se pudo cargar el documento.";
      showSnackbar("error", message);
    } finally {
      setSavingCreate(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!canEditDocumentoMetadata) {
      showSnackbar("warning", "Solo RH puede editar metadatos del expediente.");
      return;
    }

    if (!selectedDocumento) return;

    const dateError = validateDates(
      editForm.fechaDocumento,
      editForm.fechaVencimiento
    );
    if (dateError) {
      showSnackbar("error", dateError);
      return;
    }

    try {
      setSavingEdit(true);

      await updateEmpleadoDocumento(selectedDocumento.id, {
        tipo: editForm.tipo,
        fechaDocumento: editForm.fechaDocumento || null,
        fechaVencimiento: editForm.fechaVencimiento || null,
        comentario: normalizeNullableText(editForm.comentario),
      });

      setEditDialogOpen(false);
      resetEditForm();
      showSnackbar("success", "Documento actualizado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo actualizar el documento.";
      showSnackbar("error", message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReplaceSubmit = async () => {
    if (!selectedDocumento) return;

    const fileError = validateSelectedFile(replaceForm.archivo);
    if (fileError) {
      showSnackbar("error", fileError);
      return;
    }

    const dateError = validateDates(
      replaceForm.fechaDocumento,
      replaceForm.fechaVencimiento
    );
    if (dateError) {
      showSnackbar("error", dateError);
      return;
    }

    try {
      setSavingReplace(true);

      await replaceEmpleadoDocumento(selectedDocumento.id, {
        archivo: replaceForm.archivo!,
        fechaDocumento: replaceForm.fechaDocumento || null,
        fechaVencimiento: replaceForm.fechaVencimiento || null,
        comentario: normalizeNullableText(replaceForm.comentario),
      });

      setReplaceDialogOpen(false);
      resetReplaceForm();
      showSnackbar("success", "Archivo reemplazado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo reemplazar el archivo.";
      showSnackbar("error", message);
    } finally {
      setSavingReplace(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!canDeleteDocumentos) {
      showSnackbar("warning", "Solo RH puede eliminar documentos del expediente.");
      return;
    }

    if (!selectedDocumento) return;

    try {
      setDeleting(true);

      await deleteEmpleadoDocumento(selectedDocumento.id);

      setDeleteDialogOpen(false);
      setSelectedDocumento(null);
      showSnackbar("success", "Documento eliminado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo eliminar el documento.";
      showSnackbar("error", message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (documento: EmpleadoDocumento) => {
    try {
      setDownloadingId(documento.id);
      await downloadEmpleadoDocumento(
        documento.id,
        documento.nombreArchivoOriginal
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo descargar el documento.";
      showSnackbar("error", message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (documento: EmpleadoDocumento) => {
    try {
      setPreviewingId(documento.id);

      const blob = await getEmpleadoDocumentoBlob(documento.id);

      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }

      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setSelectedDocumento(documento);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No se pudo cargar la vista previa del documento.";
      showSnackbar("error", message);
    } finally {
      setPreviewingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTipoFilter("TODOS");
    setStatusFilter("TODOS");
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            Cargando expediente del empleado...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!empleado) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No fue posible cargar la información del empleado.
        </Alert>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          variant="outlined"
          onClick={handleBack}
        >
          {backLabel}
        </Button>
      </Box>
    );
  }

  const previewKind = getPreviewKind(selectedDocumento?.mimeType);

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "28px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ height: 6, bgcolor: "primary.main" }} />
            <CardContent
              sx={{
                p: { xs: 2.5, md: 3 },
                background: (theme) =>
                  `linear-gradient(180deg, ${alpha(
                    theme.palette.primary.main,
                    0.04
                  )}, transparent 75%)`,
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", lg: "center" }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FolderOpenRoundedIcon color="primary" fontSize="small" />
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary", fontWeight: 800 }}
                    >
                      {pageTitle}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, lineHeight: 1.1 }}
                  >
                    {empleadoNombre}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {pageSubtitle}
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Chip
                      icon={<BadgeRoundedIcon />}
                      label={`# ${empleadoMeta.numEmpleado ?? "SIN NÚMERO"}`}
                      variant="outlined"
                      sx={{ borderRadius: "999px" }}
                    />
                    <Chip
                      icon={<BusinessRoundedIcon />}
                      label={empleadoMeta.sucursalNombre || "Sin sucursal"}
                      variant="outlined"
                      sx={{ borderRadius: "999px" }}
                    />
                    <Chip
                      icon={<ApartmentRoundedIcon />}
                      label={empleadoMeta.departamentoNombre || "Sin departamento"}
                      variant="outlined"
                      sx={{ borderRadius: "999px" }}
                    />
                    <Chip
                      icon={<WorkOutlineRoundedIcon />}
                      label={empleadoMeta.puestoNombre || "Sin puesto"}
                      variant="outlined"
                      sx={{ borderRadius: "999px" }}
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={handleBack}
                  >
                    {backLabel}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? "Actualizando..." : "Actualizar"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DriveFolderUploadRoundedIcon />}
                    onClick={openUploadDialog}
                  >
                    Cargar documento
                  </Button>
                </Stack>
              </Stack>

              {refreshing ? (
                <LinearProgress sx={{ mt: 2, borderRadius: 999 }} />
              ) : null}
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <MetricTile
              title="Documentos"
              value={metrics.total}
              subtitle="Archivos activos"
              icon={<DescriptionRoundedIcon color="primary" />}
            />
            <MetricTile
              title="Vigentes"
              value={metrics.vigentes}
              subtitle="Documentos al corriente"
              icon={<CheckCircleRoundedIcon color="success" />}
            />
            <MetricTile
              title="Por vencer"
              value={metrics.porVencer}
              subtitle="Vencen en 30 días"
              icon={<HourglassBottomRoundedIcon color="warning" />}
            />
            <MetricTile
              title="Vencidos"
              value={metrics.vencidos}
              subtitle="Requieren atención"
              icon={<WarningAmberRoundedIcon color="error" />}
            />
          </Box>

          <SectionPanel
            title="Checklist documental"
            subtitle="Avance de requisitos y control de vencimientos."
            actions={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<TaskAltRoundedIcon />}
                  label={`Cumplimiento: ${checklist?.porcentajeCumplimiento?.toFixed(0) ?? "0"}%`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Faltantes: ${checklist?.totalFaltantes ?? 0}`}
                  variant="outlined"
                />
                <Chip
                  label={`Por vencer: ${checklist?.totalPorVencer ?? 0}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`Vencidos: ${checklist?.totalVencidos ?? 0}`}
                  color="error"
                  variant="outlined"
                />
              </Stack>
            }
          >
            <Box
              sx={{
                p: 2,
                borderRadius: "18px",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Progreso del expediente
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {checklist?.porcentajeCumplimiento?.toFixed(0) ?? "0"}%
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    label={`Requeridos: ${checklist?.totalRequeridos ?? 0}`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Cargados: ${checklist?.totalCargados ?? 0}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Faltantes: ${checklist?.totalFaltantes ?? 0}`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.max(
                  0,
                  Math.min(100, Number(checklist?.porcentajeCumplimiento ?? 0))
                )}
                sx={{
                  mt: 1.5,
                  height: 10,
                  borderRadius: 999,
                }}
              />
            </Box>

            {checklistSortedItems.length === 0 ? (
              <EmptyPanel
                title="Sin checklist"
                description="No hay elementos de checklist disponibles para este empleado."
              />
            ) : (
              <TableContainer
                sx={{
                  overflowX: "auto",
                  borderRadius: "18px",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                          fontWeight: 800,
                          color: "text.secondary",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 220 }}>Documento</TableCell>
                      <TableCell sx={{ minWidth: 110 }}>Requerido</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Estatus</TableCell>
                      <TableCell sx={{ minWidth: 260 }}>Archivo cargado</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Fecha documento</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Vencimiento</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {checklistSortedItems.map((item) => (
                      <TableRow key={item.tipo} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.tipoLabel}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip
                            size="small"
                            label={item.requerido ? "Sí" : "No"}
                            variant="outlined"
                            color={item.requerido ? "primary" : "default"}
                          />
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip
                            size="small"
                            label={getChecklistStatusLabel(item.estatus)}
                            color={getChecklistStatusTone(item.estatus)}
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell>
                          {item.nombreArchivoOriginal ? (
                            <Stack spacing={0.25}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <AttachFileRoundedIcon fontSize="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.nombreArchivoOriginal}
                                </Typography>
                              </Stack>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(item.fechaDocumento)}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(item.fechaVencimiento)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionPanel>

          <SectionPanel
            title="Historial laboral"
            subtitle="Trazabilidad de movimientos del empleado dentro del sistema."
            actions={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<TimelineRoundedIcon />}
                  label={`Movimientos: ${movimientosMetrics.total}`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={`Bajas: ${movimientosMetrics.bajas}`}
                  variant="outlined"
                  color="warning"
                />
                <Chip
                  label={`Reingresos: ${movimientosMetrics.reingresos}`}
                  variant="outlined"
                  color="success"
                />
              </Stack>
            }
          >
            {movimientos.length === 0 ? (
              <EmptyPanel
                title="Sin historial laboral"
                description="Este empleado todavía no tiene movimientos laborales registrados."
              />
            ) : (
              <Stack spacing={1.5}>
                {movimientosMetrics.ultimo ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "18px",
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                      border: "1px solid",
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Último movimiento registrado
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {getMovimientoLabel(movimientosMetrics.ultimo.tipoMovimiento)}
                        </Typography>
                      </Box>

                      <Chip
                        label={formatDate(movimientosMetrics.ultimo.fechaMovimiento)}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Box>
                ) : null}

                <Stack spacing={1.25}>
                  {movimientos.map((item) => (
                    <Card
                      key={item.id}
                      elevation={0}
                      sx={{
                        borderRadius: "20px",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                      }}
                    >
                      <CardContent sx={{ p: 2.25 }}>
                        <Stack spacing={1.25}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.25}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                          >
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "14px",
                                  display: "grid",
                                  placeItems: "center",
                                  bgcolor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.08),
                                  flexShrink: 0,
                                }}
                              >
                                {getMovimientoIcon(item.tipoMovimiento)}
                              </Box>

                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Movimiento
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={800}>
                                  {getMovimientoLabel(item.tipoMovimiento)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              alignItems="center"
                            >
                              <Chip
                                size="small"
                                label={formatDate(item.fechaMovimiento)}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={formatDateTime(item.createdAtUtc)}
                                color={getMovimientoTone(item.tipoMovimiento)}
                                variant="outlined"
                              />
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(2, minmax(0, 1fr))",
                              },
                              gap: 1.25,
                            }}
                          >
                            {item.tipoMovimiento === "BAJA" && item.tipoBaja ? (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Tipo de baja
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {getTipoBajaLabel(item.tipoBaja)}
                                </Typography>
                              </Box>
                            ) : null}

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Motivo
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {item.motivo || "—"}
                              </Typography>
                            </Box>

                            {item.comentario ? (
                              <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
                                <Typography variant="caption" color="text.secondary">
                                  Comentario
                                </Typography>
                                <Typography variant="body2">
                                  {item.comentario}
                                </Typography>
                              </Box>
                            ) : null}

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Responsable
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {item.usuarioResponsableId ?? "—"}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            )}
          </SectionPanel>

          <SectionPanel
            title="Documentos cargados"
            subtitle={
              canManageEmpleados
                ? "Administra archivos, metadatos y vigencias."
                : "Consulta, descarga y aporta documentos para tu expediente."
            }
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <TextField
                label="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="Tipo"
                value={tipoFilter}
                onChange={(e) =>
                  setTipoFilter(
                    e.target.value === "TODOS"
                      ? "TODOS"
                      : Number(e.target.value)
                  )
                }
                sx={{ minWidth: { xs: "100%", lg: 240 } }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                {TIPOS_DOCUMENTO_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Estatus"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentoStatusFilter)}
                sx={{ minWidth: { xs: "100%", lg: 210 } }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="Vigente">Vigente</MenuItem>
                <MenuItem value="Por vencer">Por vencer</MenuItem>
                <MenuItem value="Vencido">Vencido</MenuItem>
                <MenuItem value="Sin vencimiento">Sin vencimiento</MenuItem>
              </TextField>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FilterAltRoundedIcon />}
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                sx={{ minWidth: 150 }}
              >
                Limpiar filtros
              </Button>
            </Stack>

            {filteredDocuments.length === 0 ? (
              <EmptyPanel
                title="Sin documentos"
                description={
                  documentos.length === 0
                    ? "Todavía no hay documentos cargados para este empleado."
                    : "No hay documentos que coincidan con los filtros actuales."
                }
                actionLabel={documentos.length === 0 ? "Cargar documento" : undefined}
                onAction={documentos.length === 0 ? openUploadDialog : undefined}
              />
            ) : (
              <TableContainer
                sx={{
                  overflowX: "auto",
                  borderRadius: "18px",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                          fontWeight: 800,
                          color: "text.secondary",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 400 }}>Documento</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Fecha documento</TableCell>
                      <TableCell sx={{ minWidth: 190 }}>Vigencia</TableCell>
                      <TableCell align="right" sx={{ minWidth: 170 }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell sx={{ minWidth: 400 }}>
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AttachFileRoundedIcon fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {doc.tipoLabel}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{
                                pl: 3.5,
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}
                            >
                              {doc.nombreArchivoOriginal}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ pl: 3.5 }}
                            >
                              {formatBytes(doc.tamanoBytes)}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(doc.fechaDocumento)}
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.5} alignItems="flex-start">
                            <Chip
                              size="small"
                              label={doc.status.label}
                              color={doc.status.tone}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {doc.fechaVencimiento
                                ? `Vence: ${formatDate(doc.fechaVencimiento)}`
                                : "Sin vencimiento"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Stack
                            direction="row"
                            spacing={0.25}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Vista previa">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => void handlePreview(doc)}
                                  disabled={previewingId === doc.id}
                                >
                                  <VisibilityRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Descargar">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => void handleDownload(doc)}
                                  disabled={downloadingId === doc.id}
                                >
                                  <DownloadRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {canEditDocumentoMetadata ? (
                              <Tooltip title="Editar metadatos">
                                <IconButton
                                  size="small"
                                  onClick={() => openEditDialog(doc)}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}

                            {canReplaceDocumentos ? (
                              <Tooltip title="Reemplazar archivo">
                                <IconButton
                                  size="small"
                                  onClick={() => openReplaceDialog(doc)}
                                >
                                  <SwapHorizRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}

                            {canDeleteDocumentos ? (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(doc)}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionPanel>
        </Stack>
      </Box>

      <Dialog
        open={uploadDialogOpen}
        onClose={savingCreate ? undefined : () => setUploadDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cargar documento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Tipo de documento"
              value={createForm.tipo}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  tipo: Number(e.target.value),
                }))
              }
              fullWidth
            >
              {TIPOS_DOCUMENTO_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fecha del documento"
              type="date"
              value={createForm.fechaDocumento}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  fechaDocumento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={createForm.fechaVencimiento}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  fechaVencimiento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Comentario"
              value={createForm.comentario}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  comentario: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />

            <Button variant="outlined" component="label">
              {createForm.archivo ? createForm.archivo.name : "Seleccionar archivo"}
              <input
                hidden
                type="file"
                accept={ALLOWED_FILE_EXTENSIONS.join(",")}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    archivo: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={savingCreate}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleCreateSubmit()}
            variant="contained"
            disabled={savingCreate}
          >
            {savingCreate ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {canEditDocumentoMetadata ? (
        <Dialog
          open={editDialogOpen}
          onClose={savingEdit ? undefined : () => setEditDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
        <DialogTitle>Editar metadatos</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Tipo de documento"
              value={editForm.tipo}
              onChange={(e) =>
                setEditForm((current) => ({
                  ...current,
                  tipo: Number(e.target.value),
                }))
              }
              fullWidth
            >
              {TIPOS_DOCUMENTO_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fecha del documento"
              type="date"
              value={editForm.fechaDocumento}
              onChange={(e) =>
                setEditForm((current) => ({
                  ...current,
                  fechaDocumento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={editForm.fechaVencimiento}
              onChange={(e) =>
                setEditForm((current) => ({
                  ...current,
                  fechaVencimiento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Comentario"
              value={editForm.comentario}
              onChange={(e) =>
                setEditForm((current) => ({
                  ...current,
                  comentario: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={savingEdit}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleEditSubmit()}
            variant="contained"
            disabled={savingEdit}
          >
            {savingEdit ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
        </Dialog>
      ) : null}

      <Dialog
        open={replaceDialogOpen}
        onClose={savingReplace ? undefined : () => setReplaceDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reemplazar archivo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Se conservará el registro del documento, pero se actualizará el archivo y sus metadatos.
            </Alert>

            <TextField
              label="Fecha del documento"
              type="date"
              value={replaceForm.fechaDocumento}
              onChange={(e) =>
                setReplaceForm((current) => ({
                  ...current,
                  fechaDocumento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={replaceForm.fechaVencimiento}
              onChange={(e) =>
                setReplaceForm((current) => ({
                  ...current,
                  fechaVencimiento: e.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Comentario"
              value={replaceForm.comentario}
              onChange={(e) =>
                setReplaceForm((current) => ({
                  ...current,
                  comentario: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />

            <Button variant="outlined" component="label">
              {replaceForm.archivo ? replaceForm.archivo.name : "Seleccionar nuevo archivo"}
              <input
                hidden
                type="file"
                accept={ALLOWED_FILE_EXTENSIONS.join(",")}
                onChange={(e) =>
                  setReplaceForm((current) => ({
                    ...current,
                    archivo: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReplaceDialogOpen(false)}
            disabled={savingReplace}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleReplaceSubmit()}
            variant="contained"
            disabled={savingReplace}
          >
            {savingReplace ? "Reemplazando..." : "Reemplazar"}
          </Button>
        </DialogActions>
      </Dialog>

      {canDeleteDocumentos ? (
        <Dialog
          open={deleteDialogOpen}
          onClose={deleting ? undefined : () => setDeleteDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
        <DialogTitle>Eliminar documento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography>
              Esta acción marcará como eliminado el documento seleccionado.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedDocumento?.nombreArchivoOriginal ?? "—"}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleDeleteConfirm()}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
        </Dialog>
      ) : null}

      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Vista previa</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {previewUrl ? (
            previewKind === "image" ? (
              <Box
                component="img"
                src={previewUrl}
                alt={selectedDocumento?.nombreArchivoOriginal ?? "Vista previa"}
                sx={{
                  width: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  display: "block",
                  bgcolor: "#111827",
                }}
              />
            ) : previewKind === "pdf" ? (
              <Box
                component="iframe"
                src={previewUrl}
                title={selectedDocumento?.nombreArchivoOriginal ?? "Vista previa PDF"}
                sx={{
                  width: "100%",
                  height: "80vh",
                  border: 0,
                  display: "block",
                }}
              />
            ) : (
              <Box sx={{ p: 4 }}>
                <Alert severity="info">
                  Este tipo de archivo no soporta vista previa embebida. Puedes descargarlo.
                </Alert>
              </Box>
            )
          ) : (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="inherit">
            Cerrar
          </Button>
          {selectedDocumento ? (
            <Button
              onClick={() => void handleDownload(selectedDocumento)}
              startIcon={<DownloadRoundedIcon />}
              variant="contained"
            >
              Descargar
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
