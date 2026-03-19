import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

import ConfirmActionDialog from "./ui/ConfirmActionDialog";
import type {
  Incidencia,
  IncidenciaEvidencia,
} from "../api/incidencias.api";
import {
  deleteIncidenciaEvidencia,
  downloadIncidenciaEvidencia,
  saveIncidenciaEvidenciaToDisk,
  uploadIncidenciaEvidencia,
} from "../api/incidencias.api";

type Props = {
  open: boolean;
  incidencia: Incidencia | null;
  onClose: () => void;
  onChanged?: (payload: {
    incidenciaId: number;
    evidencia: IncidenciaEvidencia | null;
  }) => void;
};

type PreviewKind = "image" | "pdf" | "other" | null;

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

function getPreviewKind(
  fileName?: string | null,
  contentType?: string | null
): PreviewKind {
  const normalizedType = (contentType ?? "").toLowerCase();
  const normalizedName = (fileName ?? "").toLowerCase();

  if (normalizedType.startsWith("image/")) return "image";
  if (normalizedType === "application/pdf") return "pdf";

  if (
    normalizedName.endsWith(".jpg") ||
    normalizedName.endsWith(".jpeg") ||
    normalizedName.endsWith(".png") ||
    normalizedName.endsWith(".webp")
  ) {
    return "image";
  }

  if (normalizedName.endsWith(".pdf")) return "pdf";

  return "other";
}

export default function IncidenciaEvidenciaDialog({
  open,
  incidencia,
  onClose,
  onChanged,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>(null);

  const hasEvidencia = !!incidencia?.tieneEvidencia;

  const downloadName = useMemo(() => {
    return (
      incidencia?.evidenciaNombreOriginal ||
      `incidencia-${incidencia?.id}-evidencia`
    );
  }, [incidencia]);

  useEffect(() => {
    if (!open) return;

    setSelectedFile(null);
    setError("");
    setSuccess("");
    setConfirmDeleteOpen(false);
  }, [open, incidencia?.id]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open || !selectedFile) return;

    const nextUrl = URL.createObjectURL(selectedFile);
    const nextKind = getPreviewKind(selectedFile.name, selectedFile.type);

    setPreviewKind(nextKind);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [open, selectedFile]);

  useEffect(() => {
    if (!open || !incidencia || !incidencia.tieneEvidencia || selectedFile) {
      return;
    }

    const currentIncidencia = incidencia;
    let cancelled = false;

    async function loadPreview() {
      try {
        setPreviewLoading(true);

        const blob = await downloadIncidenciaEvidencia(currentIncidencia.id);
        if (cancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        const nextKind = getPreviewKind(
          currentIncidencia.evidenciaNombreOriginal,
          currentIncidencia.evidenciaContentType || blob.type
        );

        setPreviewKind(nextKind);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
      } catch {
        if (!cancelled) {
          setPreviewKind(
            getPreviewKind(
              currentIncidencia.evidenciaNombreOriginal,
              currentIncidencia.evidenciaContentType
            )
          );
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [open, incidencia, selectedFile]);

  const handleUpload = async () => {
    if (!incidencia) return;
    if (!selectedFile) {
      setError("Selecciona un archivo primero.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      const evidencia = await uploadIncidenciaEvidencia(
        incidencia.id,
        selectedFile
      );

      onChanged?.({
        incidenciaId: incidencia.id,
        evidencia,
      });

      setSuccess("Evidencia subida correctamente.");
      setSelectedFile(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "No se pudo subir la evidencia.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!incidencia) return;

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await saveIncidenciaEvidenciaToDisk(incidencia.id, downloadName);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "No se pudo descargar la evidencia.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!incidencia) return;

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await deleteIncidenciaEvidencia(incidencia.id);

      setPreviewKind(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSelectedFile(null);

      onChanged?.({
        incidenciaId: incidencia.id,
        evidencia: null,
      });

      setSuccess("Evidencia eliminada correctamente.");
      setConfirmDeleteOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "No se pudo eliminar la evidencia.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={busy ? undefined : onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Gestionar evidencia</DialogTitle>

        <DialogContent dividers>
          {!incidencia ? (
            <Alert severity="info">No hay incidencia seleccionada.</Alert>
          ) : (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Incidencia
                </Typography>
                <Typography fontWeight={800}>
                  #{incidencia.id} · {incidencia.empleadoNombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {String(incidencia.tipo)} · {String(incidencia.estatus)}
                </Typography>
              </Box>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Archivo actual
                  </Typography>

                  {hasEvidencia ? (
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "action.hover",
                          color: "text.secondary",
                          flexShrink: 0,
                        }}
                      >
                        {previewKind === "image" ? (
                          <ImageRoundedIcon fontSize="small" />
                        ) : previewKind === "pdf" ? (
                          <PictureAsPdfRoundedIcon fontSize="small" />
                        ) : (
                          <DescriptionRoundedIcon fontSize="small" />
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700}>
                          {incidencia.evidenciaNombreOriginal || "Archivo"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {incidencia.evidenciaContentType || "-"} ·{" "}
                          {formatBytes(incidencia.evidenciaTamanoBytes)}
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      Esta incidencia todavía no tiene evidencia.
                    </Alert>
                  )}
                </Stack>
              </Box>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Subir o reemplazar archivo
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileRoundedIcon />}
                      disabled={busy}
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Seleccionar archivo
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setSelectedFile(file);
                          setError("");
                          setSuccess("");
                        }}
                      />
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleUpload}
                      disabled={busy || !selectedFile}
                      startIcon={<UploadFileRoundedIcon />}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {busy
                        ? "Subiendo..."
                        : hasEvidencia
                        ? "Reemplazar archivo"
                        : "Subir archivo"}
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Permitidos: PDF, JPG, JPEG, PNG y WEBP. Tamaño máximo: 5 MB.
                  </Typography>

                  {selectedFile ? (
                    <Box
                      sx={{
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      <Typography fontWeight={700}>{selectedFile.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile.type || "archivo"} ·{" "}
                        {formatBytes(selectedFile.size)}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </Box>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <VisibilityRoundedIcon fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800}>
                    Vista previa
                  </Typography>
                </Stack>

                {previewLoading ? (
                  <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : !previewUrl ? (
                  <Alert severity="info">
                    No hay vista previa disponible todavía. Selecciona un archivo
                    o usa uno ya guardado.
                  </Alert>
                ) : previewKind === "image" ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Vista previa de evidencia"
                    sx={{
                      width: "100%",
                      maxHeight: 420,
                      objectFit: "contain",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "#fafafa",
                    }}
                  />
                ) : previewKind === "pdf" ? (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      overflow: "hidden",
                      height: 420,
                    }}
                  >
                    <iframe
                      src={previewUrl}
                      title="Vista previa PDF"
                      style={{ width: "100%", height: "100%", border: 0 }}
                    />
                  </Box>
                ) : (
                  <Alert
                    severity="info"
                    icon={<InsertDriveFileRoundedIcon fontSize="inherit" />}
                  >
                    Este tipo de archivo no tiene vista previa en pantalla, pero
                    sí puedes descargarlo.
                  </Alert>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={busy}>
            Cerrar
          </Button>

          {incidencia?.tieneEvidencia ? (
            <>
              <Button
                onClick={handleDownload}
                disabled={busy}
                startIcon={<DownloadRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Descargar archivo
              </Button>

              <Button
                color="error"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={busy}
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Eliminar
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        title="Eliminar evidencia"
        message="Vas a eliminar el archivo de evidencia de esta incidencia. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        confirmColor="error"
        loading={busy}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}