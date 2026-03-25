import { useCallback, useEffect, useMemo, useState } from "react";
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DriveFolderUploadRoundedIcon from "@mui/icons-material/DriveFolderUploadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
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
  getEmpleadoDocumentos,
  getTipoDocumentoEmpleadoLabel,
  TIPOS_DOCUMENTO_EMPLEADO,
  updateEmpleadoDocumento,
  type EmpleadoDocumento,
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
  label: string;
  tone: DocumentoStatusTone;
};

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [selectedDocumento, setSelectedDocumento] =
    useState<EmpleadoDocumento | null>(null);

  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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
        const [empleadoData, documentosData] = await Promise.all([
          getEmpleadoById(empleadoId),
          getEmpleadoDocumentos(empleadoId),
        ]);

        setEmpleado(empleadoData);
        setDocumentos(documentosData);
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

  const empleadoNombre = useMemo(() => {
    if (!empleado) return "Empleado";
    return getEmpleadoNombreCompleto(empleado);
  }, [empleado]);

  const metrics = useMemo(() => {
    const total = documentos.length;
    const porVencer = documentos.filter(
      (item) => getDocumentoStatus(item.fechaVencimiento).label === "Por vencer"
    ).length;
    const vencidos = documentos.filter(
      (item) => getDocumentoStatus(item.fechaVencimiento).label === "Vencido"
    ).length;

    return { total, porVencer, vencidos };
  }, [documentos]);

  const handleRefresh = async () => {
    await loadPageData(true);
  };

  const handleBack = () => {
    navigate("/empleados");
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
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {metrics.total}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  documentos
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {metrics.porVencer}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  por vencer
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {metrics.vencidos}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.82) }}>
                  vencidos
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              Control documental del empleado con acceso a carga, edición, descarga y baja lógica.
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
          title="Documentos"
          value={metrics.total}
          subtitle="Registros activos del expediente"
          icon={<FolderOpenRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Por vencer"
          value={metrics.porVencer}
          subtitle="Vigencia dentro de 30 días"
          icon={<DescriptionRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Vencidos"
          value={metrics.vencidos}
          subtitle="Requieren actualización"
          icon={<DescriptionRoundedIcon fontSize="small" />}
          badge="RH"
        />

        <MetricCard
          title="Estado"
          value={empleado.activo ? 1 : 0}
          subtitle={empleado.activo ? "Empleado activo" : "Empleado inactivo"}
          icon={<BadgeRoundedIcon fontSize="small" />}
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
        title="Documentos del expediente"
        subtitle="Administra documentos oficiales, metadata y vigencias del empleado."
        actions={
          <Chip
            label={`${documentos.length} documento${documentos.length === 1 ? "" : "s"}`}
            size="small"
            variant="outlined"
          />
        }
      >
        {documentos.length === 0 ? (
          <EmptyState
            icon={<DescriptionRoundedIcon sx={{ fontSize: 52 }} />}
            title="Aún no hay documentos cargados"
            description="Sube el primer documento para empezar a construir el expediente digital del empleado."
            actionLabel={empleado.activo ? "Subir documento" : undefined}
            onAction={empleado.activo ? handleOpenUploadDialog : undefined}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 980 }}>
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
                {documentos.map((documento) => {
                  const status = getDocumentoStatus(
                    documento.fechaVencimiento ?? null
                  );

                  return (
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
                          label={status.label}
                          color={status.tone}
                          variant={status.tone === "default" ? "outlined" : "filled"}
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
                  );
                })}
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
                ? createForm.archivo.name
                : "Seleccionar archivo (PDF, JPG, JPEG, PNG)"}
              <input
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleCreateFileChange(e.target.files?.[0] ?? null)}
              />
            </Button>

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
  icon: React.ReactNode;
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