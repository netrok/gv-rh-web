import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DriveFolderUploadRoundedIcon from "@mui/icons-material/DriveFolderUploadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { useNavigate, useParams } from "react-router-dom";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import EmptyState from "../components/ui/EmptyState";
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
  TIPOS_DOCUMENTO_EMPLEADO,
  updateEmpleadoDocumento,
  type EmpleadoDocumento,
  type EmpleadoDocumentoChecklist,
  type EmpleadoDocumentoChecklistItem,
} from "../api/empleadoDocumentos.api";
import {
  getEmpleadoById,
  getEmpleadoNombreCompleto,
  type Empleado,
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

type DocumentoStatusTone = "success" | "warning" | "error" | "default";

type DocumentoStatus = {
  label: "Vigente" | "Por vencer" | "Vencido" | "Sin vencimiento";
  tone: DocumentoStatusTone;
};

type DocumentoStatusFilter = "TODOS" | DocumentoStatus["label"];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

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

export default function ExpedienteEmpleadoPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const empleadoId = Number(id);

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [documentos, setDocumentos] = useState<EmpleadoDocumento[]>([]);
  const [checklist, setChecklist] = useState<EmpleadoDocumentoChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [selectedDocumento, setSelectedDocumento] =
    useState<EmpleadoDocumento | null>(null);

  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
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
        const [empleadoData, documentosData, checklistData] = await Promise.all([
          getEmpleadoById(empleadoId),
          getEmpleadoDocumentos(empleadoId),
          getEmpleadoDocumentosChecklist(empleadoId),
        ]);

        setEmpleado(empleadoData);
        setDocumentos(documentosData);
        setChecklist(checklistData);
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

  const documentosEnriquecidos = useMemo(() => {
    return documentos.map((item) => ({
      ...item,
      status: getDocumentoStatus(item.fechaVencimiento),
    }));
  }, [documentos]);

  const metrics = useMemo(() => {
    const total = documentosEnriquecidos.length;
    const porVencer = documentosEnriquecidos.filter(
      (item) => item.status.label === "Por vencer"
    ).length;
    const vencidos = documentosEnriquecidos.filter(
      (item) => item.status.label === "Vencido"
    ).length;
    const sinVencimiento = documentosEnriquecidos.filter(
      (item) => item.status.label === "Sin vencimiento"
    ).length;

    return { total, porVencer, vencidos, sinVencimiento };
  }, [documentosEnriquecidos]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documentosEnriquecidos.filter((item) => {
      const matchesTipo =
        tipoFilter === "TODOS" ? true : item.tipo === Number(tipoFilter);

      const matchesStatus =
        statusFilter === "TODOS" ? true : item.status.label === statusFilter;

      const matchesSearch =
        !term
          ? true
          : item.nombreArchivoOriginal.toLowerCase().includes(term) ||
            item.tipoNombre.toLowerCase().includes(term) ||
            getTipoDocumentoEmpleadoLabel(item.tipo).toLowerCase().includes(term) ||
            (item.comentario ?? "").toLowerCase().includes(term) ||
            item.mimeType.toLowerCase().includes(term);

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
    return [...(checklist?.items ?? [])].sort((a, b) => {
      if (a.requerido !== b.requerido) return a.requerido ? -1 : 1;

      const priority = (estatus: EmpleadoDocumentoChecklistItem["estatus"]) => {
        switch (estatus) {
          case "FALTANTE":
            return 0;
          case "VENCIDO":
            return 1;
          case "POR_VENCER":
            return 2;
          case "CARGADO":
            return 3;
          case "OPCIONAL":
            return 4;
          default:
            return 5;
        }
      };

      const statusCompare = priority(a.estatus) - priority(b.estatus);
      if (statusCompare !== 0) return statusCompare;

      return a.tipo - b.tipo;
    });
  }, [checklist]);

  const handleRefresh = async () => {
    await loadPageData(true);
  };

  const handleBack = () => {
    navigate("/empleados");
  };

  const openUploadDialogForTipo = (tipo: number) => {
    setCreateForm({
      ...emptyCreateForm,
      tipo,
    });
    setUploadDialogOpen(true);
  };

  const handleOpenUploadDialog = () => {
    setCreateForm(emptyCreateForm);
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    if (savingCreate) return;
    setUploadDialogOpen(false);
    setCreateForm(emptyCreateForm);
  };

  const handleOpenEditDialog = (documento: EmpleadoDocumento) => {
    setSelectedDocumento(documento);
    setEditForm({
      tipo: documento.tipo,
      fechaDocumento: documento.fechaDocumento ?? "",
      fechaVencimiento: documento.fechaVencimiento ?? "",
      comentario: documento.comentario ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    if (savingEdit) return;
    setEditDialogOpen(false);
    setSelectedDocumento(null);
    setEditForm(emptyEditForm);
  };

  const handleOpenDeleteDialog = (documento: EmpleadoDocumento) => {
    setSelectedDocumento(documento);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setSelectedDocumento(null);
  };

  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false);
    setSelectedDocumento(null);

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCreateInputChange = (
    field: keyof Omit<CreateFormState, "archivo">,
    value: string | number
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditInputChange = (
    field: keyof EditFormState,
    value: string | number
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateFileChange = (file: File | null) => {
    setCreateForm((prev) => ({
      ...prev,
      archivo: file,
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setTipoFilter("TODOS");
    setStatusFilter("TODOS");
  };

  const validateCreateForm = (): string | null => {
    if (!createForm.tipo) return "Debes seleccionar el tipo de documento.";
    if (!createForm.archivo) return "Debes seleccionar un archivo.";

    const fileExtension = getFileExtension(createForm.archivo.name);
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      return "Solo se permiten archivos PDF, JPG, JPEG o PNG.";
    }

    if (createForm.archivo.size > MAX_FILE_SIZE_BYTES) {
      return "El archivo excede el tamaño máximo permitido de 10 MB.";
    }

    if (
      createForm.fechaDocumento &&
      createForm.fechaVencimiento &&
      createForm.fechaVencimiento < createForm.fechaDocumento
    ) {
      return "La fecha de vencimiento no puede ser menor que la fecha del documento.";
    }

    return null;
  };

  const validateEditForm = (): string | null => {
    if (!editForm.tipo) return "Debes seleccionar el tipo de documento.";

    if (
      editForm.fechaDocumento &&
      editForm.fechaVencimiento &&
      editForm.fechaVencimiento < editForm.fechaDocumento
    ) {
      return "La fecha de vencimiento no puede ser menor que la fecha del documento.";
    }

    return null;
  };

  const handleCreateSubmit = async () => {
    const validationMessage = validateCreateForm();
    if (validationMessage) {
      showSnackbar("warning", validationMessage);
      return;
    }

    if (!createForm.archivo) {
      showSnackbar("warning", "Debes seleccionar un archivo.");
      return;
    }

    setSavingCreate(true);

    try {
      await createEmpleadoDocumento(empleadoId, {
        tipo: createForm.tipo,
        archivo: createForm.archivo,
        fechaDocumento: normalizeOptionalDate(createForm.fechaDocumento),
        fechaVencimiento: normalizeOptionalDate(createForm.fechaVencimiento),
        comentario: normalizeOptionalText(createForm.comentario),
      });

      setUploadDialogOpen(false);
      setCreateForm(emptyCreateForm);
      showSnackbar("success", "Documento cargado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No fue posible cargar el documento.";
      showSnackbar("error", message);
    } finally {
      setSavingCreate(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDocumento) return;

    const validationMessage = validateEditForm();
    if (validationMessage) {
      showSnackbar("warning", validationMessage);
      return;
    }

    setSavingEdit(true);

    try {
      await updateEmpleadoDocumento(selectedDocumento.id, {
        tipo: editForm.tipo,
        fechaDocumento: normalizeOptionalDate(editForm.fechaDocumento),
        fechaVencimiento: normalizeOptionalDate(editForm.fechaVencimiento),
        comentario: normalizeOptionalText(editForm.comentario),
      });

      setEditDialogOpen(false);
      setSelectedDocumento(null);
      setEditForm(emptyEditForm);
      showSnackbar("success", "Documento actualizado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No fue posible actualizar el documento.";
      showSnackbar("error", message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDocumento) return;

    setDeleting(true);

    try {
      await deleteEmpleadoDocumento(selectedDocumento.id);
      setDeleteDialogOpen(false);
      setSelectedDocumento(null);
      showSnackbar("success", "Documento eliminado correctamente.");
      await loadPageData(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No fue posible eliminar el documento.";
      showSnackbar("error", message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (documento: EmpleadoDocumento) => {
    setDownloadingId(documento.id);

    try {
      await downloadEmpleadoDocumento(
        documento.id,
        documento.nombreArchivoOriginal
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No fue posible descargar el documento.";
      showSnackbar("error", message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (documento: EmpleadoDocumento) => {
    setPreviewingId(documento.id);

    try {
      const blob = await getEmpleadoDocumentoBlob(documento.id);
      const objectUrl = window.URL.createObjectURL(blob);

      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(objectUrl);
      setSelectedDocumento(documento);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No fue posible previsualizar el documento.";
      showSnackbar("error", message);
    } finally {
      setPreviewingId(null);
    }
  };

  const resolveDocumentoFromChecklistItem = (
    item: EmpleadoDocumentoChecklistItem
  ): EmpleadoDocumento | null => {
    if (!item.documentoId) return null;
    return documentos.find((doc) => doc.id === item.documentoId) ?? null;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "55vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack spacing={2} alignItems="center">
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
      <AppPage
        eyebrow="Recursos Humanos"
        title="Expediente del empleado"
        subtitle="Consulta y administración documental."
      >
        <SectionCard title="Expediente" subtitle="No disponible">
          <EmptyState
            icon={<DescriptionRoundedIcon sx={{ fontSize: 52 }} />}
            title="No se encontró el empleado"
            description="El expediente que intentas abrir no existe o no está disponible."
            actionLabel="Regresar a empleados"
            onAction={handleBack}
          />
        </SectionCard>
      </AppPage>
    );
  }

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Expediente del empleado"
      subtitle="Gestión documental, vigencias y administración del expediente digital."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={handleBack}
          >
            Regresar
          </Button>

          <Button
            variant="outlined"
            startIcon={
              refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="contained"
            startIcon={<DriveFolderUploadRoundedIcon />}
            onClick={handleOpenUploadDialog}
            disabled={!empleado.activo}
          >
            Subir documento
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Expediente digital"
        title={empleadoNombre}
        subtitle={`${empleado.numEmpleado}${empleado.email ? ` • ${empleado.email}` : ""}`}
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={empleado.activo ? "Activo" : "Inactivo"}
              sx={{
                color: empleado.activo ? "#166534" : "#991b1b",
                backgroundColor: empleado.activo
                  ? alpha("#bbf7d0", 0.95)
                  : alpha("#fecaca", 0.95),
                fontWeight: 800,
              }}
            />
            <Chip
              size="small"
              label="Expediente"
              variant="outlined"
              sx={{
                color: "#fff",
                borderColor: alpha("#ffffff", 0.18),
                backgroundColor: alpha("#ffffff", 0.08),
                fontWeight: 800,
              }}
            />
          </Stack>
        }
        aside={
          <Stack spacing={1.25}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.8) }}>
              Cumplimiento documental
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {checklist ? `${formatPercent(checklist.porcentajeCumplimiento)}%` : "—"}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  cumplimiento
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {checklist?.totalFaltantes ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  faltantes
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {checklist?.totalVencidos ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  vencidos
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Control documental del empleado con acceso a carga, edición, vista previa, descarga y baja lógica.
            </Typography>
          </Stack>
        }
      />

      {!empleado.activo && (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon />}
          sx={{ borderRadius: 3 }}
        >
          El empleado está inactivo. Puedes consultar el expediente, pero no se recomienda seguir cargando documentación operativa hasta confirmar su estatus.
        </Alert>
      )}

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
          title="Documentos"
          value={metrics.total}
          subtitle="Registros activos del expediente"
          icon={<FolderOpenRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Cumplimiento"
          value={Number(formatPercent(checklist?.porcentajeCumplimiento ?? 0))}
          subtitle="Porcentaje del checklist"
          icon={<TaskAltRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Faltantes"
          value={checklist?.totalFaltantes ?? 0}
          subtitle="Documentos requeridos pendientes"
          icon={<DescriptionRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Vencidos"
          value={checklist?.totalVencidos ?? 0}
          subtitle="Requieren actualización"
          icon={<WarningAmberRoundedIcon fontSize="small" />}
          badge="RH"
        />
      </Box>

      <SectionCard
        title="Datos del empleado"
        subtitle="Contexto general del expediente actual."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={empleado.numEmpleado}
            sx={{ fontWeight: 800 }}
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
          <InfoTile
            icon={<ApartmentRoundedIcon fontSize="small" />}
            label="Departamento"
            value={empleado.departamentoNombre ?? "Sin departamento"}
          />
          <InfoTile
            icon={<WorkOutlineRoundedIcon fontSize="small" />}
            label="Puesto"
            value={empleado.puestoNombre ?? "Sin puesto"}
          />
          <InfoTile
            icon={<BusinessRoundedIcon fontSize="small" />}
            label="Sucursal"
            value={empleado.sucursalNombre ?? "Sin sucursal"}
          />
          <InfoTile
            icon={<BadgeRoundedIcon fontSize="small" />}
            label="Estado"
            value={empleado.activo ? "Empleado activo" : "Empleado inactivo"}
          />
        </Box>
      </SectionCard>

      <SectionCard
        title="Checklist del expediente"
        subtitle="Control de documentos requeridos y estatus general de cumplimiento."
        actions={
          <Chip
            size="small"
            variant="outlined"
            label={`${checklist?.totalCargados ?? 0}/${checklist?.totalRequeridos ?? 0} requeridos cubiertos`}
            sx={{ fontWeight: 800 }}
          />
        }
      >
        {checklist ? (
          <Stack spacing={2}>
            <Box
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha("#0f172a", 0.08)}`,
                backgroundColor: alpha("#0f172a", 0.02),
                px: 2,
                py: 1.5,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800 }}>
                    Cumplimiento documental
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: "#0f172a" }}>
                    {formatPercent(checklist.porcentajeCumplimiento)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {checklist.totalCargados} de {checklist.totalRequeridos} documentos requeridos están cubiertos.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<CheckCircleRoundedIcon />}
                    label={`${checklist.totalCargados} cargados`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    icon={<DescriptionRoundedIcon />}
                    label={`${checklist.totalFaltantes} faltantes`}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    icon={<HourglassBottomRoundedIcon />}
                    label={`${checklist.totalPorVencer} por vencer`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    icon={<WarningAmberRoundedIcon />}
                    label={`${checklist.totalVencidos} vencidos`}
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>
              </Stack>

              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(
                    0,
                    Math.min(100, Number(checklist.porcentajeCumplimiento))
                  )}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: alpha("#0f172a", 0.08),
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Documento</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Requerido</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Estatus</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Archivo</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Fecha documento</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Fecha vencimiento</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {checklistSortedItems.map((item) => {
                    const documento = resolveDocumentoFromChecklistItem(item);

                    return (
                      <TableRow key={`${item.tipo}-${item.tipoNombre}`} hover>
                        <TableCell>
                          <Stack spacing={0.4}>
                            <Typography fontWeight={800}>
                              {getTipoDocumentoEmpleadoLabel(item.tipo)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.tipoNombre}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={item.requerido ? "Sí" : "Opcional"}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={getChecklistStatusLabel(item.estatus)}
                            color={getChecklistStatusTone(item.estatus)}
                            variant={
                              getChecklistStatusTone(item.estatus) === "default"
                                ? "outlined"
                                : "filled"
                            }
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            color={item.nombreArchivoOriginal ? "text.primary" : "text.secondary"}
                          >
                            {item.nombreArchivoOriginal ?? "Sin archivo"}
                          </Typography>
                        </TableCell>

                        <TableCell>{formatDate(item.fechaDocumento)}</TableCell>
                        <TableCell>{formatDate(item.fechaVencimiento)}</TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            {documento ? (
                              <>
                                {canPreviewDocumento(documento) && (
                                  <Tooltip title="Vista previa">
                                    <span>
                                      <IconButton
                                        onClick={() => void handlePreview(documento)}
                                        disabled={previewingId === documento.id}
                                      >
                                        {previewingId === documento.id ? (
                                          <CircularProgress size={18} />
                                        ) : (
                                          <VisibilityRoundedIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}

                                <Tooltip title="Descargar">
                                  <span>
                                    <IconButton
                                      onClick={() => void handleDownload(documento)}
                                      disabled={downloadingId === documento.id}
                                    >
                                      {downloadingId === documento.id ? (
                                        <CircularProgress size={18} />
                                      ) : (
                                        <DownloadRoundedIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Tooltip title="Editar metadata">
                                  <span>
                                    <IconButton
                                      onClick={() => handleOpenEditDialog(documento)}
                                    >
                                      <EditRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            ) : empleado.activo ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DriveFolderUploadRoundedIcon />}
                                onClick={() => openUploadDialogForTipo(item.tipo)}
                              >
                                Subir
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Sin acción
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        )}
      </SectionCard>

      <SectionCard
        title="Filtros"
        subtitle="Busca por archivo, comentario, tipo o estatus documental."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              color={activeFiltersCount > 0 ? "primary" : undefined}
              label={
                activeFiltersCount > 0
                  ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""}`
                  : "Sin filtros"
              }
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearRoundedIcon />}
              onClick={clearFilters}
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
              md: "repeat(12, 1fr)",
            },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 6" } }}>
            <TextField
              label="Buscar"
              placeholder="Archivo, comentario, tipo, mime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) =>
                setTipoFilter(
                  e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAltRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {TIPOS_DOCUMENTO_EMPLEADO.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
            <TextField
              select
              label="Estatus"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DocumentoStatusFilter)
              }
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="Vigente">Vigente</MenuItem>
              <MenuItem value="Por vencer">Por vencer</MenuItem>
              <MenuItem value="Vencido">Vencido</MenuItem>
              <MenuItem value="Sin vencimiento">Sin vencimiento</MenuItem>
            </TextField>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Documentos del expediente"
        subtitle="Administra documentos oficiales, metadata y vigencias del empleado."
        actions={
          <Chip
            label={`${filteredDocuments.length} visible${filteredDocuments.length === 1 ? "" : "s"} de ${documentos.length}`}
            size="small"
            variant="outlined"
          />
        }
      >
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={<DescriptionRoundedIcon sx={{ fontSize: 52 }} />}
            title={
              documentos.length === 0
                ? "Aún no hay documentos cargados"
                : "No hay coincidencias con los filtros"
            }
            description={
              documentos.length === 0
                ? "Sube el primer documento para empezar a construir el expediente digital del empleado."
                : "Ajusta la búsqueda o limpia los filtros para ver más resultados."
            }
            actionLabel={
              documentos.length === 0 && empleado.activo ? "Subir documento" : undefined
            }
            onAction={
              documentos.length === 0 && empleado.activo
                ? handleOpenUploadDialog
                : undefined
            }
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 1080 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Archivo</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Fecha documento</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Fecha vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Estatus</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Comentario</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredDocuments.map((documento) => (
                  <TableRow
                    key={documento.id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={800}>
                          {getTipoDocumentoEmpleadoLabel(documento.tipo)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {documento.tipoNombre}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>
                          {documento.nombreArchivoOriginal}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {documento.mimeType} • {formatBytes(documento.tamanoBytes)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>{formatDate(documento.fechaDocumento)}</TableCell>
                    <TableCell>{formatDate(documento.fechaVencimiento)}</TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={documento.status.label}
                        color={documento.status.tone}
                        variant={
                          documento.status.tone === "default" ? "outlined" : "filled"
                        }
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        variant="body2"
                        color={documento.comentario ? "text.primary" : "text.secondary"}
                      >
                        {documento.comentario?.trim() || "Sin comentario"}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        {canPreviewDocumento(documento) && (
                          <Tooltip title="Vista previa">
                            <span>
                              <IconButton
                                onClick={() => void handlePreview(documento)}
                                disabled={previewingId === documento.id}
                              >
                                {previewingId === documento.id ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <VisibilityRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        <Tooltip title="Descargar">
                          <span>
                            <IconButton
                              onClick={() => void handleDownload(documento)}
                              disabled={downloadingId === documento.id}
                            >
                              {downloadingId === documento.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <DownloadRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Editar metadata">
                          <span>
                            <IconButton onClick={() => handleOpenEditDialog(documento)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Eliminar">
                          <span>
                            <IconButton
                              onClick={() => handleOpenDeleteDialog(documento)}
                              color="error"
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </SectionCard>

      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Subir documento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Tipo de documento"
              value={createForm.tipo}
              onChange={(e) =>
                handleCreateInputChange("tipo", Number(e.target.value))
              }
              fullWidth
            >
              {TIPOS_DOCUMENTO_EMPLEADO.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileRoundedIcon />}
              sx={{ justifyContent: "flex-start" }}
            >
              {createForm.archivo
                ? "Cambiar archivo"
                : "Seleccionar archivo (PDF, JPG, JPEG, PNG)"}
              <input
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleCreateFileChange(e.target.files?.[0] ?? null)}
              />
            </Button>

            {createForm.archivo ? (
              <Box
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha("#0f172a", 0.08)}`,
                  backgroundColor: alpha("#0f172a", 0.02),
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack spacing={0.4}>
                  <Typography fontWeight={800}>
                    {createForm.archivo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(createForm.archivo.size)} • {createForm.archivo.type || "Tipo no identificado"}
                  </Typography>
                </Stack>
              </Box>
            ) : null}

            <Typography variant="caption" color="text.secondary">
              Tamaño máximo permitido: 10 MB.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Fecha del documento"
                type="date"
                value={createForm.fechaDocumento}
                onChange={(e) =>
                  handleCreateInputChange("fechaDocumento", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fecha de vencimiento"
                type="date"
                value={createForm.fechaVencimiento}
                onChange={(e) =>
                  handleCreateInputChange("fechaVencimiento", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Comentario"
              value={createForm.comentario}
              onChange={(e) =>
                handleCreateInputChange("comentario", e.target.value)
              }
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 1000 }}
              helperText={`${createForm.comentario.length}/1000`}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseUploadDialog} disabled={savingCreate}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateSubmit()}
            disabled={savingCreate}
            startIcon={
              savingCreate ? <CircularProgress size={16} /> : <DriveFolderUploadRoundedIcon />
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar documento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Tipo de documento"
              value={editForm.tipo}
              onChange={(e) =>
                handleEditInputChange("tipo", Number(e.target.value))
              }
              fullWidth
            >
              {TIPOS_DOCUMENTO_EMPLEADO.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Fecha del documento"
                type="date"
                value={editForm.fechaDocumento}
                onChange={(e) =>
                  handleEditInputChange("fechaDocumento", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fecha de vencimiento"
                type="date"
                value={editForm.fechaVencimiento}
                onChange={(e) =>
                  handleEditInputChange("fechaVencimiento", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Comentario"
              value={editForm.comentario}
              onChange={(e) =>
                handleEditInputChange("comentario", e.target.value)
              }
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 1000 }}
              helperText={`${editForm.comentario.length}/1000`}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={savingEdit}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleEditSubmit()}
            disabled={savingEdit}
            startIcon={savingEdit ? <CircularProgress size={16} /> : <EditRoundedIcon />}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Eliminar documento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography>
              Esta acción dará de baja el documento del expediente.
            </Typography>
            <Typography fontWeight={800}>
              {selectedDocumento?.nombreArchivoOriginal ?? "Documento"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              El archivo físico también se intentará eliminar del servidor.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDeleteSubmit()}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} /> : <DeleteOutlineRoundedIcon />
            }
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreviewDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Vista previa
          {selectedDocumento ? ` • ${selectedDocumento.nombreArchivoOriginal}` : ""}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {selectedDocumento && previewUrl ? (
            isPdfDocumento(selectedDocumento) ? (
              <Box
                component="iframe"
                src={previewUrl}
                title={selectedDocumento.nombreArchivoOriginal}
                sx={{
                  width: "100%",
                  height: "75vh",
                  border: 0,
                }}
              />
            ) : isImageDocumento(selectedDocumento) ? (
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  minHeight: "70vh",
                  backgroundColor: "#0f172a",
                }}
              >
                <Box
                  component="img"
                  src={previewUrl}
                  alt={selectedDocumento.nombreArchivoOriginal}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ p: 4 }}>
                <Alert severity="info">
                  Este tipo de archivo no tiene vista previa integrada.
                </Alert>
              </Box>
            )
          ) : (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClosePreviewDialog}>Cerrar</Button>
          {selectedDocumento ? (
            <Button
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => void handleDownload(selectedDocumento)}
            >
              Descargar
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppPage>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        gridColumn: { xs: "span 1", md: "span 3" },
        borderRadius: 3,
        border: `1px solid ${alpha("#0f172a", 0.08)}`,
        backgroundColor: alpha("#0f172a", 0.015),
        px: 2,
        py: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: "#1d4ed8",
            backgroundColor: alpha("#1d4ed8", 0.08),
            border: `1px solid ${alpha("#1d4ed8", 0.14)}`,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#64748b",
              lineHeight: 1.1,
            }}
          >
            {label}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function getDocumentoStatus(
  fechaVencimiento?: string | null
): DocumentoStatus {
  if (!fechaVencimiento) {
    return {
      label: "Sin vencimiento",
      tone: "default",
    };
  }

  const vencimiento = parseDateOnly(fechaVencimiento);
  if (!vencimiento) {
    return {
      label: "Sin vencimiento",
      tone: "default",
    };
  }

  const today = startOfDay(new Date());
  const diffMs = vencimiento.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Vencido",
      tone: "error",
    };
  }

  if (diffDays <= 30) {
    return {
      label: "Por vencer",
      tone: "warning",
    };
  }

  return {
    label: "Vigente",
    tone: "success",
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = parseDateOnly(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

function normalizeOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isPdfDocumento(documento: EmpleadoDocumento): boolean {
  return documento.mimeType.toLowerCase().includes("pdf") ||
    documento.nombreArchivoOriginal.toLowerCase().endsWith(".pdf");
}

function isImageDocumento(documento: EmpleadoDocumento): boolean {
  const mime = documento.mimeType.toLowerCase();
  const fileName = documento.nombreArchivoOriginal.toLowerCase();

  return (
    mime.startsWith("image/") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png")
  );
}

function canPreviewDocumento(documento: EmpleadoDocumento): boolean {
  return isPdfDocumento(documento) || isImageDocumento(documento);
}