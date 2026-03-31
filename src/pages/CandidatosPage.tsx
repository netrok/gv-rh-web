import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Chip,
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
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  createCandidato,
  deleteCandidatoCv,
  downloadCandidatoCv,
  getCandidatos,
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
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function toPayload(form: CandidatoFormState): CreateCandidatoRequest | UpdateCandidatoRequest {
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
    pretensionSalarial: form.pretensionSalarial ? Number(form.pretensionSalarial) : null,
    activo: form.activo,
  };
}

function fromCandidatoToForm(item: CandidatoListItem): CandidatoFormState {
  const [nombres = "", apellidoPaterno = "", apellidoMaterno = ""] =
    item.nombreCompleto.split(" ");

  return {
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    telefono: item.telefono ?? "",
    email: item.email ?? "",
    fechaNacimiento: "",
    ciudad: "",
    fuenteReclutamiento: item.fuenteReclutamiento ?? "",
    resumenPerfil: "",
    pretensionSalarial: item.pretensionSalarial?.toString() ?? "",
    activo: item.activo,
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
  const [selectedForCv, setSelectedForCv] = useState<CandidatoListItem | null>(null);
  const [form, setForm] = useState<CandidatoFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

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
      setError(err?.response?.data ?? "No se pudo crear el candidato.");
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
      setError(err?.response?.data ?? "No se pudo actualizar el candidato.");
    },
  });

  const uploadCvMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadCandidatoCv(id, file),
    onSuccess: () => {
      invalidate();
      setSelectedForCv(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const deleteCvMutation = useMutation({
    mutationFn: (id: number) => deleteCandidatoCv(id),
    onSuccess: () => invalidate(),
  });

  const downloadCvMutation = useMutation({
    mutationFn: async (item: CandidatoListItem) => {
      const blob = await downloadCandidatoCv(item.id);
      triggerBlobDownload(blob, `${item.nombreCompleto.replace(/\s+/g, "_")}_CV`);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setError(null);
    setOpenForm(true);
  }

  function openEdit(item: CandidatoListItem) {
    setEditing(item);
    setForm(fromCandidatoToForm(item));
    setError(null);
    setOpenForm(true);
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

      <SectionCard title="Listado de candidatos" subtitle="Desde aquí puedes editar, subir CV y descargarlo.">
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
                      >
                        {item.tieneCv ? "Reemplazar CV" : "Subir CV"}
                      </Button>

                      {item.tieneCv ? (
                        <>
                          <Button
                            size="small"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={() => downloadCvMutation.mutate(item)}
                          >
                            Descargar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineRoundedIcon />}
                            onClick={() => deleteCvMutation.mutate(item.id)}
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

      <Dialog open={openForm} onClose={() => !busy && setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar candidato" : "Nuevo candidato"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Nombres"
                  value={form.nombres}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombres: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Apellido paterno"
                  value={form.apellidoPaterno}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, apellidoPaterno: e.target.value }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Apellido materno"
                  value={form.apellidoMaterno}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, apellidoMaterno: e.target.value }))
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
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Correo"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Fecha nacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fechaNacimiento: e.target.value }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Ciudad"
                  value={form.ciudad}
                  onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Fuente de reclutamiento"
                  value={form.fuenteReclutamiento}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fuenteReclutamiento: e.target.value }))
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
                    setForm((prev) => ({ ...prev, pretensionSalarial: e.target.value }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Resumen de perfil"
              value={form.resumenPerfil}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, resumenPerfil: e.target.value }))
              }
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              select
              label="Activo"
              value={form.activo ? "si" : "no"}
              onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.value === "si" }))}
              fullWidth
            >
              <MenuItem value="si">Sí</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submitForm} variant="contained" disabled={busy}>
            {editing ? "Guardar cambios" : "Crear candidato"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}