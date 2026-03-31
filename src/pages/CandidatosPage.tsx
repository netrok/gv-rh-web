import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  createCandidato,
  deleteCandidatoCv,
  downloadCandidatoCv,
  getCandidatoById,
  getCandidatos,
  type CandidatoDetail,
  type CandidatoListItem,
  type CreateCandidatoRequest,
  type UpdateCandidatoRequest,
  updateCandidato,
  uploadCandidatoCv,
} from "../api/reclutamiento.api";

type CandidatoFormState = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  ciudad: string;
  fuenteReclutamiento: string;
  resumenPerfil: string;
  pretensionSalarial: string;
  activo: boolean;
};

const initialForm: CandidatoFormState = {
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
  ciudad: "",
  fuenteReclutamiento: "",
  resumenPerfil: "",
  pretensionSalarial: "",
  activo: true,
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatMoney(value?: number | null) {
  if (value == null) return "—";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeDateInput(value?: string | null) {
  if (!value) return "";

  const direct = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function getErrorMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.message ??
    err?.response?.data?.title ??
    (typeof err?.response?.data === "string" ? err.response.data : null) ??
    err?.message ??
    fallback
  );
}

function toPayload(
  form: CandidatoFormState
): CreateCandidatoRequest | UpdateCandidatoRequest {
  return {
    nombres: form.nombres.trim(),
    apellidoPaterno: form.apellidoPaterno.trim(),
    apellidoMaterno: form.apellidoMaterno.trim() || null,
    telefono: form.telefono.trim() || null,
    email: form.email.trim() || null,
    fechaNacimiento: form.fechaNacimiento || null,
    ciudad: form.ciudad.trim() || null,
    fuenteReclutamiento: form.fuenteReclutamiento.trim() || null,
    resumenPerfil: form.resumenPerfil.trim() || null,
    pretensionSalarial: form.pretensionSalarial.trim()
      ? Number(form.pretensionSalarial)
      : null,
    activo: form.activo,
  };
}

function fromCandidatoDetailToForm(detail: CandidatoDetail): CandidatoFormState {
  return {
    nombres: detail.nombres ?? "",
    apellidoPaterno: detail.apellidoPaterno ?? "",
    apellidoMaterno: detail.apellidoMaterno ?? "",
    telefono: detail.telefono ?? "",
    email: detail.email ?? "",
    fechaNacimiento: normalizeDateInput(detail.fechaNacimiento),
    ciudad: detail.ciudad ?? "",
    fuenteReclutamiento: detail.fuenteReclutamiento ?? "",
    resumenPerfil: detail.resumenPerfil ?? "",
    pretensionSalarial:
      detail.pretensionSalarial == null ? "" : String(detail.pretensionSalarial),
    activo: Boolean(detail.activo),
  };
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function CandidatosPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [q, setQ] = useState("");
  const [fuenteReclutamiento, setFuenteReclutamiento] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<CandidatoListItem | null>(null);
  const [selectedForCv, setSelectedForCv] = useState<CandidatoListItem | null>(
    null
  );
  const [form, setForm] = useState<CandidatoFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loadingEditDetail, setLoadingEditDetail] = useState(false);

  const { data: candidatos = [], isLoading } = useQuery({
    queryKey: ["reclutamiento", "candidatos", { q, fuenteReclutamiento, soloActivos }],
    queryFn: () =>
      getCandidatos({
        q: q || undefined,
        fuenteReclutamiento: fuenteReclutamiento || undefined,
        soloActivos,
      }),
  });

  const summary = {
    total: candidatos.length,
    conCv: candidatos.filter((x) => x.tieneCv).length,
    activos: candidatos.filter((x) => x.activo).length,
    sinCv: candidatos.filter((x) => !x.tieneCv).length,
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["reclutamiento", "candidatos"] });

  const createMutation = useMutation({
    mutationFn: createCandidato,
    onSuccess: () => {
      invalidate();
      setOpenForm(false);
      setEditing(null);
      setForm(initialForm);
      setError(null);
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, "No se pudo crear el candidato."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCandidatoRequest }) =>
      updateCandidato(id, payload),
    onSuccess: () => {
      invalidate();
      setOpenForm(false);
      setEditing(null);
      setForm(initialForm);
      setError(null);
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, "No se pudo actualizar el candidato."));
    },
  });

  const uploadCvMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadCandidatoCv(id, file),
    onSuccess: () => {
      invalidate();
      setSelectedForCv(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, "No se pudo subir el CV."));
    },
  });

  const deleteCvMutation = useMutation({
    mutationFn: (id: number) => deleteCandidatoCv(id),
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      setError(getErrorMessage(err, "No se pudo eliminar el CV."));
    },
  });

  const downloadCvMutation = useMutation({
    mutationFn: async (item: CandidatoListItem) => {
      const blob = await downloadCandidatoCv(item.id);
      triggerBlobDownload(blob, `${item.nombreCompleto.replace(/\s+/g, "_")}_CV`);
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, "No se pudo descargar el CV."));
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setError(null);
    setOpenForm(true);
  }

  async function openEdit(item: CandidatoListItem) {
    try {
      setLoadingEditDetail(true);
      setError(null);

      const detail = await getCandidatoById(item.id);

      setEditing(item);
      setForm(fromCandidatoDetailToForm(detail));
      setOpenForm(true);
    } catch (err: any) {
      setError(getErrorMessage(err, "No se pudo cargar el detalle del candidato."));
    } finally {
      setLoadingEditDetail(false);
    }
  }

  function closeForm() {
    if (busy) return;

    setOpenForm(false);
    setEditing(null);
    setForm(initialForm);
    setError(null);
  }

  function submitForm() {
    if (!form.nombres.trim() || !form.apellidoPaterno.trim()) {
      setError("Nombres y apellido paterno son obligatorios.");
      return;
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: toPayload(form),
      });
      return;
    }

    createMutation.mutate(toPayload(form));
  }

  const busy =
    loadingEditDetail ||
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadCvMutation.isPending ||
    deleteCvMutation.isPending ||
    downloadCvMutation.isPending;

  return (
    <AppPage
      title="Candidatos"
      subtitle="Administra candidatos, CVs y datos base antes de postularlos a una vacante."
      actions={
        <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreate}>
          Nuevo candidato
        </Button>
      }
    >
      <HeroBanner
        title="Banco de talento"
        subtitle="Registra, corrige y reutiliza candidatos sin amarrarlos desde el día uno a una sola vacante."
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Total" value={summary.total} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Activos" value={summary.activos} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Con CV" value={summary.conCv} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Sin CV" value={summary.sinCv} />
        </Grid>
      </Grid>

      <SectionCard title="Filtros" subtitle="Busca por nombre, correo, teléfono o fuente.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              placeholder="Nombre, correo o teléfono"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Fuente de reclutamiento"
              value={fuenteReclutamiento}
              onChange={(e) => setFuenteReclutamiento(e.target.value)}
              fullWidth
              placeholder="Indeed, Referido, LinkedIn..."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Activos"
              value={soloActivos ? "si" : "no"}
              onChange={(e) => setSoloActivos(e.target.value === "si")}
              fullWidth
            >
              <MenuItem value="si">Sí</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        title="Listado de candidatos"
        subtitle="Desde aquí puedes editar, subir CV y descargarlo."
      >
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : candidatos.length === 0 ? (
          <Alert severity="info">No hay candidatos con los filtros actuales.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Candidato</TableCell>
                <TableCell>Fuente</TableCell>
                <TableCell>Pretensión</TableCell>
                <TableCell>CV</TableCell>
                <TableCell>Alta</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidatos.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{item.nombreCompleto}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.email || "Sin correo"} · {item.telefono || "Sin teléfono"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.fuenteReclutamiento || "—"}</TableCell>
                  <TableCell>{formatMoney(item.pretensionSalarial)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.tieneCv ? "Con CV" : "Sin CV"}
                      color={item.tieneCv ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAtUtc)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                      <Button
                        size="small"
                        startIcon={<EditRoundedIcon />}
                        onClick={() => openEdit(item)}
                        disabled={busy}
                      >
                        Editar
                      </Button>

                      <Button
                        size="small"
                        startIcon={<CloudUploadRoundedIcon />}
                        onClick={() => {
                          setSelectedForCv(item);
                          fileInputRef.current?.click();
                        }}
                        disabled={busy}
                      >
                        {item.tieneCv ? "Reemplazar CV" : "Subir CV"}
                      </Button>

                      {item.tieneCv ? (
                        <>
                          <Button
                            size="small"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={() => downloadCvMutation.mutate(item)}
                            disabled={busy}
                          >
                            Descargar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineRoundedIcon />}
                            onClick={() => deleteCvMutation.mutate(item.id)}
                            disabled={busy}
                          >
                            Eliminar CV
                          </Button>
                        </>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !selectedForCv) return;
            uploadCvMutation.mutate({ id: selectedForCv.id, file });
          }}
        />
      </SectionCard>

      <Dialog open={openForm} onClose={closeForm} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar candidato" : "Nuevo candidato"}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            {loadingEditDetail ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Cargando detalle del candidato...</Typography>
              </Stack>
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Nombres"
                      value={form.nombres}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, nombres: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Apellido paterno"
                      value={form.apellidoPaterno}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          apellidoPaterno: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Apellido materno"
                      value={form.apellidoMaterno}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          apellidoMaterno: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Teléfono"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, telefono: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Correo"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Fecha nacimiento"
                      type="date"
                      value={form.fechaNacimiento}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fechaNacimiento: e.target.value,
                        }))
                      }
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Ciudad"
                      value={form.ciudad}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, ciudad: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Fuente de reclutamiento"
                      value={form.fuenteReclutamiento}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fuenteReclutamiento: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Pretensión salarial"
                      type="number"
                      value={form.pretensionSalarial}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pretensionSalarial: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Resumen de perfil"
                  value={form.resumenPerfil}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      resumenPerfil: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={3}
                />

                <TextField
                  select
                  label="Activo"
                  value={form.activo ? "si" : "no"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      activo: e.target.value === "si",
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="si">Sí</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeForm} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={submitForm}
            variant="contained"
            disabled={busy || loadingEditDetail}
          >
            {editing ? "Guardar cambios" : "Crear candidato"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}