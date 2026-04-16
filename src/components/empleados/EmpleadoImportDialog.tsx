import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import {
  downloadEmpleadoImportTemplate,
  importEmpleadoExcel,
  validateEmpleadoImport,
  type EmpleadoImportError,
  type EmpleadoImportExecuteResult,
  type EmpleadoImportValidateResult,
} from "../../api/empleados.api";

type EmpleadoImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported?: (
    result: EmpleadoImportExecuteResult
  ) => void | Promise<void>;
};

type FeedbackState =
  | { type: "success" | "error" | "info"; message: string }
  | null;

export default function EmpleadoImportDialog({
  open,
  onClose,
  onImported,
}: EmpleadoImportDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [validationResult, setValidationResult] =
    useState<EmpleadoImportValidateResult | null>(null);
  const [importResult, setImportResult] =
    useState<EmpleadoImportExecuteResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const busy = validating || importing || downloading;

  const validRows = validationResult?.validRows ?? 0;
  const errorRows = validationResult?.errorRows ?? 0;
  const importErrorRows = importResult?.errorRows ?? 0;
  const canImport = Boolean(selectedFile) && validRows > 0 && !busy;

  const visibleErrors = useMemo<EmpleadoImportError[]>(() => {
    if (importResult?.errors?.length) return importResult.errors;
    if (validationResult?.errors?.length) return validationResult.errors;
    return [];
  }, [importResult, validationResult]);

  const resetState = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setFeedback(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (busy) return;
    resetState();
    onClose();
  };

  const handlePickFile = () => {
    inputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setValidationResult(null);
    setImportResult(null);
    setFeedback(
      file
        ? {
            type: "info",
            message: `Archivo seleccionado: ${file.name}`,
          }
        : null
    );
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      setFeedback(null);

      await downloadEmpleadoImportTemplate();

      setFeedback({
        type: "success",
        message: "Plantilla descargada correctamente.",
      });
    } catch (error: any) {
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.message ??
          "No se pudo descargar la plantilla.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      setFeedback({
        type: "error",
        message: "Primero selecciona un archivo Excel.",
      });
      return;
    }

    try {
      setValidating(true);
      setFeedback(null);
      setImportResult(null);

      const result = await validateEmpleadoImport(selectedFile);
      setValidationResult(result);

      if (result.errorRows > 0) {
        setFeedback({
          type: "info",
          message:
            "La validación terminó. Revisa los errores antes de importar.",
        });
      } else {
        setFeedback({
          type: "success",
          message: "Validación correcta. El archivo está listo para importar.",
        });
      }
    } catch (error: any) {
      setValidationResult(null);
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.message ??
          "No se pudo validar el archivo.",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setFeedback({
        type: "error",
        message: "Primero selecciona un archivo Excel.",
      });
      return;
    }

    try {
      setImporting(true);
      setFeedback(null);

      const result = await importEmpleadoExcel(selectedFile);
      setImportResult(result);

      if (result.insertedRows > 0) {
        setFeedback({
          type: "success",
          message: `Importación completada. Insertados: ${result.insertedRows}.`,
        });
      } else {
        setFeedback({
          type: "info",
          message:
            "La importación terminó, pero no se insertaron filas válidas.",
        });
      }

      await onImported?.(result);
    } catch (error: any) {
      setImportResult(null);
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.message ??
          "No se pudo importar el archivo.",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            flexWrap="wrap"
          >
            <CloudUploadRoundedIcon />
            <Typography variant="h6" fontWeight={800}>
              Importar empleados desde Excel
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Descarga la plantilla oficial, valida el archivo y luego importa
            solo las filas correctas.
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {busy && <LinearProgress />}

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {feedback && (
              <Alert severity={feedback.type}>{feedback.message}</Alert>
            )}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Stack spacing={0.75}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Archivo de importación
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Usa únicamente archivos .xlsx basados en la plantilla del
                    sistema.
                  </Typography>

                  {selectedFile ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DescriptionRoundedIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={700}>
                        {selectedFile.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${(selectedFile.size / 1024).toFixed(1)} KB`}
                      />
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aún no has seleccionado archivo.
                    </Typography>
                  )}
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadRoundedIcon />}
                    onClick={handleDownloadTemplate}
                    disabled={busy}
                  >
                    Descargar plantilla
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<UploadFileRoundedIcon />}
                    onClick={handlePickFile}
                    disabled={busy}
                  >
                    Seleccionar Excel
                  </Button>

                  <input
                    ref={inputRef}
                    type="file"
                    hidden
                    accept=".xlsx"
                    onChange={handleFileSelected}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={1.5}
                >
                  <Stack spacing={0.75}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Validación e importación
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Primero valida. Después importa únicamente las filas que
                      sí pasaron.
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<FactCheckRoundedIcon />}
                      onClick={handleValidate}
                      disabled={!selectedFile || busy}
                    >
                      Validar archivo
                    </Button>

                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      onClick={handleImport}
                      disabled={!canImport}
                    >
                      Importar filas válidas
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.25}
                  flexWrap="wrap"
                >
                  <Chip
                    color="primary"
                    label={`Total: ${
                      importResult?.totalRows ??
                      validationResult?.totalRows ??
                      0
                    }`}
                  />

                  <Chip
                    color="success"
                    label={`Válidas: ${
                      importResult?.insertedRows ??
                      validationResult?.validRows ??
                      0
                    }`}
                  />

                  <Chip
                    color={
                      errorRows > 0 || importErrorRows > 0
                        ? "warning"
                        : "default"
                    }
                    label={`Con error: ${
                      importResult?.errorRows ??
                      validationResult?.errorRows ??
                      0
                    }`}
                  />

                  <Chip
                    label={`Omitidas: ${importResult?.skippedRows ?? 0}`}
                  />
                </Stack>
              </Stack>
            </Paper>

            {visibleErrors.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ p: 2, pb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WarningAmberRoundedIcon color="warning" />
                    <Typography variant="subtitle1" fontWeight={800}>
                      Errores detectados
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Revisa fila, campo y mensaje. El backend ya filtra las
                    malas, pero aquí está el golpe seco.
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: 360, overflow: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Fila</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Campo</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Mensaje</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Valor</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {visibleErrors.map((error, index) => (
                        <TableRow
                          key={`${error.rowNumber}-${error.field}-${index}`}
                          hover
                        >
                          <TableCell>{error.rowNumber}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell>{error.message}</TableCell>
                          <TableCell>{error.value ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}