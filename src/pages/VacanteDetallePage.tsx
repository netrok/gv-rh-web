import { useMemo, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import { useNavigate, useParams } from "react-router-dom";
import AppPage from "../components/ui/AppPage";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import {
  contratarPostulacion,
  convertirPostulacionAEmpleado,
  createPostulacion,
  descartarPostulacion,
  etapaLabels,
  etapaOrder,
  getCandidatos,
  getDepartamentosCatalogo,
  getPostulaciones,
  getPuestosCatalogo,
  getSucursalesCatalogo,
  getVacanteById,
  moverPostulacionEtapa,
  type CatalogoItem,
  type EtapaPostulacion,
  type PostulacionListItem,
} from "../api/reclutamiento.api";

type AddPostulacionForm = {
  candidatoId: string;
  observacionesInternas: string;
};

type MoveForm = {
  etapaNueva: EtapaPostulacion;
  comentario: string;
};

type DiscardForm = {
  motivoDescarte: string;
  comentario: string;
};

type HireForm = {
  comentario: string;
};

type ConvertForm = {
  departamentoId: string;
  puestoId: string;
  sucursalId: string;
  fechaIngreso: string;
  activo: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function etapaColor(etapa: EtapaPostulacion) {
  switch (etapa) {
    case "CONTRATADO":
      return "success";
    case "DESCARTADO":
      return "error";
    case "OFERTA":
      return "info";
    case "ENTREVISTA_RH":
    case "ENTREVISTA_LIDER":
      return "secondary";
    case "FILTRO_RH":
      return "warning";
    case "POSTULADO":
    default:
      return "default";
  }
}

export default function VacanteDetallePage() {
  const { id } = useParams();
  const vacanteId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openAdd, setOpenAdd] = useState(false);
  const [openMove, setOpenMove] = useState(false);
  const [openDiscard, setOpenDiscard] = useState(false);
  const [openHire, setOpenHire] = useState(false);
  const [openConvert, setOpenConvert] = useState(false);

  const [selected, setSelected] = useState<PostulacionListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<AddPostulacionForm>({
    candidatoId: "",
    observacionesInternas: "",
  });

  const [moveForm, setMoveForm] = useState<MoveForm>({
    etapaNueva: "FILTRO_RH",
    comentario: "",
  });

  const [discardForm, setDiscardForm] = useState<DiscardForm>({
    motivoDescarte: "",
    comentario: "",
  });

  const [hireForm, setHireForm] = useState<HireForm>({
    comentario: "",
  });

  const [convertForm, setConvertForm] = useState<ConvertForm>({
    departamentoId: "",
    puestoId: "",
    sucursalId: "",
    fechaIngreso: new Date().toISOString().slice(0, 10),
    activo: true,
  });

  const { data: vacante, isLoading: loadingVacante } = useQuery({
    queryKey: ["reclutamiento", "vacante", vacanteId],
    queryFn: () => getVacanteById(vacanteId),
    enabled: Number.isFinite(vacanteId),
  });

  const { data: postulaciones = [], isLoading: loadingPostulaciones } = useQuery({
    queryKey: ["reclutamiento", "postulaciones", { vacanteId }],
    queryFn: () => getPostulaciones({ vacanteId, soloActivas: true }),
    enabled: Number.isFinite(vacanteId),
  });

  const { data: candidatos = [] } = useQuery({
    queryKey: ["reclutamiento", "candidatos", "disponibles", vacanteId],
    queryFn: () => getCandidatos({ soloActivos: true }),
    enabled: Number.isFinite(vacanteId),
  });

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

  const filteredPuestos = useMemo(() => {
    if (!convertForm.departamentoId) return puestos;
    return puestos.filter(
      (item) =>
        item.departamentoId == null || String(item.departamentoId) === convertForm.departamentoId
    );
  }, [puestos, convertForm.departamentoId]);

  const grouped = useMemo(() => {
    const map = new Map<EtapaPostulacion, PostulacionListItem[]>();
    etapaOrder.forEach((etapa) => map.set(etapa, []));
    postulaciones.forEach((item) => {
      map.get(item.etapaActual)?.push(item);
    });
    return map;
  }, [postulaciones]);

  const summary = {
    total: postulaciones.length,
    contratados: postulaciones.filter((x) => x.etapaActual === "CONTRATADO").length,
    descartados: postulaciones.filter((x) => x.etapaActual === "DESCARTADO").length,
    activas: postulaciones.filter(
      (x) => x.etapaActual !== "CONTRATADO" && x.etapaActual !== "DESCARTADO"
    ).length,
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["reclutamiento", "vacante", vacanteId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["reclutamiento", "postulaciones", { vacanteId }],
    });
    await queryClient.invalidateQueries({
      queryKey: ["reclutamiento", "vacantes"],
    });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      createPostulacion({
        vacanteId,
        candidatoId: Number(addForm.candidatoId),
        observacionesInternas: addForm.observacionesInternas.trim() || null,
      }),
    onSuccess: async () => {
      await invalidate();
      setOpenAdd(false);
      setAddForm({ candidatoId: "", observacionesInternas: "" });
      setError(null);
    },
    onError: (err: any) =>
      setError(err?.response?.data ?? "No se pudo crear la postulación."),
  });

  const moveMutation = useMutation({
    mutationFn: () =>
      moverPostulacionEtapa(selected!.id, {
        etapaNueva: moveForm.etapaNueva,
        comentario: moveForm.comentario.trim() || null,
      }),
    onSuccess: async () => {
      await invalidate();
      setOpenMove(false);
      setSelected(null);
      setMoveForm({ etapaNueva: "FILTRO_RH", comentario: "" });
      setError(null);
    },
    onError: (err: any) =>
      setError(err?.response?.data ?? "No se pudo mover la postulación."),
  });

  const discardMutation = useMutation({
    mutationFn: () =>
      descartarPostulacion(selected!.id, {
        motivoDescarte: discardForm.motivoDescarte.trim(),
        comentario: discardForm.comentario.trim() || null,
      }),
    onSuccess: async () => {
      await invalidate();
      setOpenDiscard(false);
      setSelected(null);
      setDiscardForm({ motivoDescarte: "", comentario: "" });
      setError(null);
    },
    onError: (err: any) =>
      setError(err?.response?.data ?? "No se pudo descartar la postulación."),
  });

  const hireMutation = useMutation({
    mutationFn: () =>
      contratarPostulacion(selected!.id, {
        comentario: hireForm.comentario.trim() || null,
      }),
    onSuccess: async () => {
      await invalidate();
      setOpenHire(false);
      setSelected(null);
      setHireForm({ comentario: "" });
      setError(null);
    },
    onError: (err: any) =>
      setError(err?.response?.data ?? "No se pudo contratar."),
  });

  const convertMutation = useMutation({
    mutationFn: () =>
      convertirPostulacionAEmpleado(selected!.id, {
        departamentoId: Number(convertForm.departamentoId),
        puestoId: Number(convertForm.puestoId),
        sucursalId: Number(convertForm.sucursalId),
        fechaIngreso: convertForm.fechaIngreso,
        activo: convertForm.activo,
      }),
    onSuccess: async (data) => {
      await invalidate();
      setOpenConvert(false);
      setSelected(null);
      setError(null);
      navigate(`/empleados/${data.id}/expediente`);
    },
    onError: (err: any) =>
      setError(err?.response?.data ?? "No se pudo convertir a empleado."),
  });

  function openMoveDialog(item: PostulacionListItem) {
    setSelected(item);
    setMoveForm({
      etapaNueva: item.etapaActual === "POSTULADO" ? "FILTRO_RH" : "ENTREVISTA_RH",
      comentario: "",
    });
    setOpenMove(true);
    setError(null);
  }

  function openDiscardDialog(item: PostulacionListItem) {
    setSelected(item);
    setDiscardForm({ motivoDescarte: "", comentario: "" });
    setOpenDiscard(true);
    setError(null);
  }

  function openHireDialog(item: PostulacionListItem) {
    setSelected(item);
    setHireForm({ comentario: "" });
    setOpenHire(true);
    setError(null);
  }

  function openConvertDialog(item: PostulacionListItem) {
    setSelected(item);
    setConvertForm({
      departamentoId: String(vacante?.departamentoId ?? ""),
      puestoId: String(vacante?.puestoId ?? ""),
      sucursalId: String(vacante?.sucursalId ?? ""),
      fechaIngreso: new Date().toISOString().slice(0, 10),
      activo: true,
    });
    setOpenConvert(true);
    setError(null);
  }

  const isBusy =
    addMutation.isPending ||
    moveMutation.isPending ||
    discardMutation.isPending ||
    hireMutation.isPending ||
    convertMutation.isPending;

  const candidatosDisponibles = useMemo(() => {
    const yaPostulados = new Set(postulaciones.map((p) => p.candidatoId));
    return candidatos.filter((c) => !yaPostulados.has(c.id));
  }, [candidatos, postulaciones]);

  if (!Number.isFinite(vacanteId)) {
    return (
      <AppPage title="Vacante" subtitle="Ruta inválida.">
        <Alert severity="error">La ruta de vacante es inválida.</Alert>
      </AppPage>
    );
  }

  return (
    <AppPage
      title={vacante?.titulo ?? "Detalle de vacante"}
      subtitle="Administra postulaciones, movimientos de etapa, descarte, contratación y alta a empleado."
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            variant="outlined"
            onClick={() => navigate("/reclutamiento/vacantes")}
          >
            Volver
          </Button>
          <Button
            startIcon={<GroupAddRoundedIcon />}
            variant="contained"
            onClick={() => {
              setOpenAdd(true);
              setError(null);
            }}
          >
            Agregar postulación
          </Button>
        </Stack>
      }
    >
      <HeroBanner
        title={vacante?.titulo ?? "Vacante"}
        subtitle={
          vacante
            ? `${vacante.folio} · ${vacante.departamentoNombre} · ${vacante.puestoNombre} · ${vacante.sucursalNombre}`
            : "Cargando vacante..."
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Postulaciones" value={summary.total} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Activas" value={summary.activas} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Contratados" value={summary.contratados} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard title="Descartados" value={summary.descartados} />
        </Grid>
      </Grid>

      <SectionCard
        title="Resumen de vacante"
        subtitle="Datos base de la posición."
      >
        {loadingVacante || !vacante ? (
          <Typography>Loading...</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Estatus
              </Typography>
              <Chip label={vacante.estatus} color="success" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Posiciones
              </Typography>
              <Typography fontWeight={700}>
                {vacante.contratadosTotal}/{vacante.numeroPosiciones}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha apertura
              </Typography>
              <Typography fontWeight={700}>{vacante.fechaApertura}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha cierre
              </Typography>
              <Typography fontWeight={700}>{vacante.fechaCierre || "—"}</Typography>
            </Grid>

            {vacante.descripcion ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Descripción
                </Typography>
                <Typography>{vacante.descripcion}</Typography>
              </Grid>
            ) : null}

            {vacante.perfil ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Perfil
                </Typography>
                <Typography>{vacante.perfil}</Typography>
              </Grid>
            ) : null}
          </Grid>
        )}
      </SectionCard>

      <SectionCard
        title="Pipeline por etapa"
        subtitle="Mantén el proceso claro y sin brincos raros. Aquí se ve quién va dónde."
      >
        {loadingPostulaciones ? (
          <Typography>Loading...</Typography>
        ) : postulaciones.length === 0 ? (
          <Alert severity="info">Todavía no hay postulaciones en esta vacante.</Alert>
        ) : (
          <Grid container spacing={2}>
            {etapaOrder.map((etapa) => {
              const items = grouped.get(etapa) ?? [];
              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={etapa}>
                  <SectionCard
                    title={etapaLabels[etapa]}
                    subtitle={`${items.length} candidato(s)`}
                  >
                    <Stack spacing={1.5}>
                      {items.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin candidatos en esta etapa.
                        </Typography>
                      ) : (
                        items.map((item) => (
                          <Stack
                            key={item.id}
                            spacing={1}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={1}
                            >
                              <Typography fontWeight={700}>
                                {item.candidatoNombre}
                              </Typography>
                              <Chip
                                size="small"
                                label={etapaLabels[item.etapaActual]}
                                color={etapaColor(item.etapaActual)}
                              />
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              Último movimiento:{" "}
                              {formatDateTime(item.fechaUltimoMovimientoUtc)}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                            >
                              {item.etapaActual !== "CONTRATADO" &&
                              item.etapaActual !== "DESCARTADO" ? (
                                <>
                                  <Button
                                    size="small"
                                    startIcon={<TrendingUpRoundedIcon />}
                                    onClick={() => openMoveDialog(item)}
                                  >
                                    Mover
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    startIcon={<CancelRoundedIcon />}
                                    onClick={() => openDiscardDialog(item)}
                                  >
                                    Descartar
                                  </Button>
                                </>
                              ) : null}

                              {item.etapaActual !== "CONTRATADO" &&
                              item.etapaActual !== "DESCARTADO" ? (
                                <Button
                                  size="small"
                                  color="success"
                                  startIcon={<CheckCircleRoundedIcon />}
                                  onClick={() => openHireDialog(item)}
                                >
                                  Contratar
                                </Button>
                              ) : null}

                              {item.etapaActual === "CONTRATADO" &&
                              !item.empleadoId ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<BadgeRoundedIcon />}
                                  onClick={() => openConvertDialog(item)}
                                >
                                  Convertir a empleado
                                </Button>
                              ) : null}

                              {item.empleadoId ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PersonAddAlt1RoundedIcon />}
                                  onClick={() =>
                                    navigate(`/empleados/${item.empleadoId}/expediente`)
                                  }
                                >
                                  Ver expediente
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  </SectionCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </SectionCard>

      <Dialog
        open={openAdd}
        onClose={() => !isBusy && setOpenAdd(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Agregar postulación</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Candidato"
              value={addForm.candidatoId}
              onChange={(e) =>
                setAddForm((prev) => ({
                  ...prev,
                  candidatoId: e.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="">Selecciona</MenuItem>
              {candidatosDisponibles.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.nombreCompleto}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Observaciones internas"
              value={addForm.observacionesInternas}
              onChange={(e) =>
                setAddForm((prev) => ({
                  ...prev,
                  observacionesInternas: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!addForm.candidatoId) {
                setError("Selecciona un candidato.");
                return;
              }
              addMutation.mutate();
            }}
            variant="contained"
            disabled={isBusy}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openMove}
        onClose={() => !isBusy && setOpenMove(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Mover etapa</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Nueva etapa"
              value={moveForm.etapaNueva}
              onChange={(e) =>
                setMoveForm((prev) => ({
                  ...prev,
                  etapaNueva: e.target.value as EtapaPostulacion,
                }))
              }
              fullWidth
            >
              {etapaOrder
                .filter(
                  (item) => item !== "CONTRATADO" && item !== "DESCARTADO"
                )
                .map((item) => (
                  <MenuItem key={item} value={item}>
                    {etapaLabels[item]}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="Comentario"
              value={moveForm.comentario}
              onChange={(e) =>
                setMoveForm((prev) => ({
                  ...prev,
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
          <Button onClick={() => setOpenMove(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            onClick={() => moveMutation.mutate()}
            variant="contained"
            disabled={isBusy}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDiscard}
        onClose={() => !isBusy && setOpenDiscard(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Descartar postulación</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Motivo de descarte"
              value={discardForm.motivoDescarte}
              onChange={(e) =>
                setDiscardForm((prev) => ({
                  ...prev,
                  motivoDescarte: e.target.value,
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Comentario"
              value={discardForm.comentario}
              onChange={(e) =>
                setDiscardForm((prev) => ({
                  ...prev,
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
          <Button onClick={() => setOpenDiscard(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (!discardForm.motivoDescarte.trim()) {
                setError("El motivo de descarte es obligatorio.");
                return;
              }
              discardMutation.mutate();
            }}
            variant="contained"
            disabled={isBusy}
          >
            Descartar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openHire}
        onClose={() => !isBusy && setOpenHire(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Marcar como contratado</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Comentario"
              value={hireForm.comentario}
              onChange={(e) => setHireForm({ comentario: e.target.value })}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHire(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            color="success"
            onClick={() => hireMutation.mutate()}
            variant="contained"
            disabled={isBusy}
          >
            Confirmar contratación
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConvert}
        onClose={() => !isBusy && setOpenConvert(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Convertir a empleado</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Departamento"
                  value={convertForm.departamentoId}
                  onChange={(e) =>
                    setConvertForm((prev) => ({
                      ...prev,
                      departamentoId: e.target.value,
                      puestoId: "",
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {departamentos.map((item: CatalogoItem) => (
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
                  value={convertForm.puestoId}
                  onChange={(e) =>
                    setConvertForm((prev) => ({
                      ...prev,
                      puestoId: e.target.value,
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {filteredPuestos.map((item: CatalogoItem) => (
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
                  value={convertForm.sucursalId}
                  onChange={(e) =>
                    setConvertForm((prev) => ({
                      ...prev,
                      sucursalId: e.target.value,
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {sucursales.map((item: CatalogoItem) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Fecha de ingreso"
                  type="date"
                  value={convertForm.fechaIngreso}
                  onChange={(e) =>
                    setConvertForm((prev) => ({
                      ...prev,
                      fechaIngreso: e.target.value,
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Activo"
                  value={convertForm.activo ? "si" : "no"}
                  onChange={(e) =>
                    setConvertForm((prev) => ({
                      ...prev,
                      activo: e.target.value === "si",
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="si">Sí</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConvert(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (
                !convertForm.departamentoId ||
                !convertForm.puestoId ||
                !convertForm.sucursalId ||
                !convertForm.fechaIngreso
              ) {
                setError(
                  "Completa departamento, puesto, sucursal y fecha de ingreso."
                );
                return;
              }
              convertMutation.mutate();
            }}
            variant="contained"
            disabled={isBusy}
          >
            Crear empleado
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}