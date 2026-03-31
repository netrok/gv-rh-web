import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { useNavigate } from "react-router-dom";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  abrirVacante,
  cancelarVacante,
  cerrarVacante,
  createVacante,
  estatusVacanteLabels,
  getDepartamentosCatalogo,
  getPuestosCatalogo,
  getSucursalesCatalogo,
  getVacantes,
  pausarVacante,
  type CreateVacanteRequest,
  type EstatusVacante,
  type UpdateVacanteRequest,
  type VacanteListItem,
  updateVacante,
} from "../api/reclutamiento.api";

type VacanteFormState = {
  titulo: string;
  departamentoId: string;
  puestoId: string;
  sucursalId: string;
  numeroPosiciones: string;
  descripcion: string;
  perfil: string;
  salarioMinimo: string;
  salarioMaximo: string;
  fechaApertura: string;
  crearComoBorrador: boolean;
  activo: boolean;
};

const initialForm: VacanteFormState = {
  titulo: "",
  departamentoId: "",
  puestoId: "",
  sucursalId: "",
  numeroPosiciones: "1",
  descripcion: "",
  perfil: "",
  salarioMinimo: "",
  salarioMaximo: "",
  fechaApertura: new Date().toISOString().slice(0, 10),
  crearComoBorrador: false,
  activo: true,
};

function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function estatusColor(estatus: EstatusVacante) {
  switch (estatus) {
    case "ABIERTA":
      return "success";
    case "PAUSADA":
      return "warning";
    case "CERRADA":
      return "default";
    case "CANCELADA":
      return "error";
    case "BORRADOR":
      return "info";
    default:
      return "default";
  }
}

function toCreatePayload(form: VacanteFormState): CreateVacanteRequest {
  return {
    titulo: form.titulo.trim(),
    departamentoId: Number(form.departamentoId),
    puestoId: Number(form.puestoId),
    sucursalId: Number(form.sucursalId),
    numeroPosiciones: Number(form.numeroPosiciones),
    descripcion: form.descripcion.trim() || null,
    perfil: form.perfil.trim() || null,
    salarioMinimo: form.salarioMinimo ? Number(form.salarioMinimo) : null,
    salarioMaximo: form.salarioMaximo ? Number(form.salarioMaximo) : null,
    fechaApertura: form.fechaApertura,
    crearComoBorrador: form.crearComoBorrador,
    activo: form.activo,
  };
}

function toUpdatePayload(form: VacanteFormState): UpdateVacanteRequest {
  return {
    titulo: form.titulo.trim(),
    departamentoId: Number(form.departamentoId),
    puestoId: Number(form.puestoId),
    sucursalId: Number(form.sucursalId),
    numeroPosiciones: Number(form.numeroPosiciones),
    descripcion: form.descripcion.trim() || null,
    perfil: form.perfil.trim() || null,
    salarioMinimo: form.salarioMinimo ? Number(form.salarioMinimo) : null,
    salarioMaximo: form.salarioMaximo ? Number(form.salarioMaximo) : null,
    fechaApertura: form.fechaApertura,
    activo: form.activo,
  };
}

function fromVacanteToForm(v: VacanteListItem): VacanteFormState {
  return {
    titulo: v.titulo,
    departamentoId: String(v.departamentoId),
    puestoId: String(v.puestoId),
    sucursalId: String(v.sucursalId),
    numeroPosiciones: String(v.numeroPosiciones),
    descripcion: "",
    perfil: "",
    salarioMinimo: "",
    salarioMaximo: "",
    fechaApertura: v.fechaApertura,
    crearComoBorrador: v.estatus === "BORRADOR",
    activo: v.activo,
  };
}

export default function VacantesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [estatus, setEstatus] = useState<EstatusVacante | "">("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<VacanteListItem | null>(null);
  const [form, setForm] = useState<VacanteFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const { data: departamentos = [] } = useQuery({
    queryKey: ["catalogos", "departamentos"],
    queryFn: getDepartamentosCatalogo,
  });

  const { data: puestos = [] } = useQuery({
    queryKey: ["catalogos", "puestos"],
    queryFn: getPuestosCatalogo,
  });

  const { data: sucursales = [] } = useQuery({
    queryKey: ["catalogos", "sucursales"],
    queryFn: getSucursalesCatalogo,
  });

  const { data: vacantes = [], isLoading } = useQuery({
    queryKey: ["reclutamiento", "vacantes", { q, estatus, departamentoId, soloActivas }],
    queryFn: () =>
      getVacantes({
        q: q || undefined,
        estatus: estatus || undefined,
        departamentoId: departamentoId ? Number(departamentoId) : undefined,
        soloActivas,
      }),
  });

  const filteredPuestos = useMemo(() => {
    if (!form.departamentoId) return puestos;
    return puestos.filter(
      (p) => p.departamentoId == null || String(p.departamentoId) === form.departamentoId
    );
  }, [puestos, form.departamentoId]);

  const summary = useMemo(() => {
    return {
      total: vacantes.length,
      abiertas: vacantes.filter((x) => x.estatus === "ABIERTA").length,
      pausadas: vacantes.filter((x) => x.estatus === "PAUSADA").length,
      cerradas: vacantes.filter((x) => x.estatus === "CERRADA").length,
    };
  }, [vacantes]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["reclutamiento", "vacantes"] });

  const createMutation = useMutation({
    mutationFn: createVacante,
    onSuccess: () => {
      invalidate();
      setOpenForm(false);
      setEditing(null);
      setForm(initialForm);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data ?? "No se pudo crear la vacante.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateVacanteRequest }) =>
      updateVacante(id, payload),
    onSuccess: () => {
      invalidate();
      setOpenForm(false);
      setEditing(null);
      setForm(initialForm);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data ?? "No se pudo actualizar la vacante.");
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: number;
      action: "abrir" | "pausar" | "cerrar" | "cancelar";
    }) => {
      if (action === "abrir") return abrirVacante(id);
      if (action === "pausar") return pausarVacante(id);
      if (action === "cerrar") return cerrarVacante(id);
      return cancelarVacante(id);
    },
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setError(null);
    setOpenForm(true);
  }

  function openEdit(vacante: VacanteListItem) {
    setEditing(vacante);
    setForm(fromVacanteToForm(vacante));
    setError(null);
    setOpenForm(true);
  }

  function submitForm() {
    if (
      !form.titulo.trim() ||
      !form.departamentoId ||
      !form.puestoId ||
      !form.sucursalId ||
      !form.numeroPosiciones ||
      !form.fechaApertura
    ) {
      setError("Completa título, departamento, puesto, sucursal, posiciones y fecha.");
      return;
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: toUpdatePayload(form),
      });
      return;
    }

    createMutation.mutate(toCreatePayload(form));
  }

  const busy =
    createMutation.isPending || updateMutation.isPending || actionMutation.isPending;

  return (
    <AppPage
      title="Vacantes"
      subtitle="Controla posiciones abiertas, pausadas, cerradas y su pipeline de reclutamiento."
      actions={
        <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreate}>
          Nueva vacante
        </Button>
      }
    >
      <HeroBanner
        title="Reclutamiento"
        subtitle="Aquí nace el flujo formal del empleado: vacante, candidato, proceso y contratación."
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Total" value={summary.total} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Abiertas" value={summary.abiertas} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Pausadas" value={summary.pausadas} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Cerradas" value={summary.cerradas} />
        </Grid>
      </Grid>

      <SectionCard
        title="Filtros"
        subtitle="Busca por folio o título y afina por estatus y departamento."
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              placeholder="Folio o título"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Estatus"
              value={estatus}
              onChange={(e) => setEstatus(e.target.value as EstatusVacante | "")}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              {(["BORRADOR", "ABIERTA", "PAUSADA", "CERRADA", "CANCELADA"] as EstatusVacante[]).map(
                (item) => (
                  <MenuItem key={item} value={item}>
                    {estatusVacanteLabels[item]}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              label="Departamento"
              value={departamentoId}
              onChange={(e) => setDepartamentoId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              {departamentos.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              label="Activas"
              value={soloActivas ? "si" : "no"}
              onChange={(e) => setSoloActivas(e.target.value === "si")}
              fullWidth
            >
              <MenuItem value="si">Sí</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        title="Listado de vacantes"
        subtitle="Abre el detalle para ver postulaciones, etapas y acciones de contratación."
      >
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : vacantes.length === 0 ? (
          <Alert severity="info">No hay vacantes con los filtros actuales.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vacante</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Posiciones</TableCell>
                <TableCell>Estatus</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vacantes.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{item.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.folio}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.departamentoNombre} · {item.puestoNombre}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.sucursalNombre}</TableCell>
                  <TableCell>
                    {item.posicionesCubiertas}/{item.numeroPosiciones}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={estatusVacanteLabels[item.estatus]}
                      color={estatusColor(item.estatus)}
                    />
                  </TableCell>
                  <TableCell>{formatDateOnly(item.fechaApertura)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                      <Button
                        size="small"
                        startIcon={<LaunchRoundedIcon />}
                        onClick={() => navigate(`/reclutamiento/vacantes/${item.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditRoundedIcon />}
                        onClick={() => openEdit(item)}
                      >
                        Editar
                      </Button>

                      {item.estatus === "BORRADOR" || item.estatus === "PAUSADA" ? (
                        <Button
                          size="small"
                          startIcon={<PlayCircleOutlineRoundedIcon />}
                          onClick={() => actionMutation.mutate({ id: item.id, action: "abrir" })}
                        >
                          Abrir
                        </Button>
                      ) : null}

                      {item.estatus === "ABIERTA" ? (
                        <Button
                          size="small"
                          startIcon={<PauseCircleOutlineRoundedIcon />}
                          onClick={() => actionMutation.mutate({ id: item.id, action: "pausar" })}
                        >
                          Pausar
                        </Button>
                      ) : null}

                      {item.estatus !== "CERRADA" && item.estatus !== "CANCELADA" ? (
                        <>
                          <Button
                            size="small"
                            startIcon={<TaskAltRoundedIcon />}
                            onClick={() => actionMutation.mutate({ id: item.id, action: "cerrar" })}
                          >
                            Cerrar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={() =>
                              actionMutation.mutate({ id: item.id, action: "cancelar" })
                            }
                          >
                            Cancelar
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
      </SectionCard>

      <Dialog open={openForm} onClose={() => !busy && setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar vacante" : "Nueva vacante"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label="Título"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Departamento"
                  value={form.departamentoId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      departamentoId: e.target.value,
                      puestoId: "",
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {departamentos.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Puesto"
                  value={form.puestoId}
                  onChange={(e) => setForm((prev) => ({ ...prev, puestoId: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {filteredPuestos.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Sucursal"
                  value={form.sucursalId}
                  onChange={(e) => setForm((prev) => ({ ...prev, sucursalId: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {sucursales.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Posiciones"
                  type="number"
                  value={form.numeroPosiciones}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, numeroPosiciones: e.target.value }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Fecha apertura"
                  type="date"
                  value={form.fechaApertura}
                  onChange={(e) => setForm((prev) => ({ ...prev, fechaApertura: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Salario mínimo"
                  type="number"
                  value={form.salarioMinimo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, salarioMinimo: e.target.value }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Salario máximo"
                  type="number"
                  value={form.salarioMaximo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, salarioMaximo: e.target.value }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            {!editing ? (
              <TextField
                select
                label="Crear como"
                value={form.crearComoBorrador ? "borrador" : "abierta"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    crearComoBorrador: e.target.value === "borrador",
                  }))
                }
                fullWidth
              >
                <MenuItem value="abierta">Vacante abierta</MenuItem>
                <MenuItem value="borrador">Borrador</MenuItem>
              </TextField>
            ) : null}

            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              label="Perfil"
              value={form.perfil}
              onChange={(e) => setForm((prev) => ({ ...prev, perfil: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            {editing ? (
              <TextField
                select
                label="Activo"
                value={form.activo ? "si" : "no"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activo: e.target.value === "si" }))
                }
                fullWidth
              >
                <MenuItem value="si">Sí</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
            ) : null}

            {editing && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Rango salarial actual: {formatMoney(Number(form.salarioMinimo) || null)} -{" "}
                  {formatMoney(Number(form.salarioMaximo) || null)}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submitForm} variant="contained" disabled={busy}>
            {editing ? "Guardar cambios" : "Crear vacante"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}