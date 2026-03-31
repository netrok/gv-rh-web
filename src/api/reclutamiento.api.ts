import { api } from "./axios";

export type EstatusVacante =
  | "BORRADOR"
  | "ABIERTA"
  | "PAUSADA"
  | "CERRADA"
  | "CANCELADA";

export type EtapaPostulacion =
  | "POSTULADO"
  | "FILTRO_RH"
  | "ENTREVISTA_RH"
  | "ENTREVISTA_LIDER"
  | "OFERTA"
  | "CONTRATADO"
  | "DESCARTADO";

export type CatalogoItem = {
  id: number;
  nombre: string;
  activo?: boolean;
  departamentoId?: number | null;
};

export type VacanteListItem = {
  id: number;
  folio: string;
  titulo: string;
  departamentoId: number;
  departamentoNombre: string;
  puestoId: number;
  puestoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  numeroPosiciones: number;
  posicionesCubiertas: number;
  fechaApertura: string;
  fechaCierre?: string | null;
  estatus: EstatusVacante;
  activo: boolean;
};

export type VacanteDetail = {
  id: number;
  folio: string;
  titulo: string;
  departamentoId: number;
  departamentoNombre: string;
  puestoId: number;
  puestoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  numeroPosiciones: number;
  descripcion?: string | null;
  perfil?: string | null;
  salarioMinimo?: number | null;
  salarioMaximo?: number | null;
  fechaApertura: string;
  fechaCierre?: string | null;
  estatus: EstatusVacante;
  activo: boolean;
  postulacionesTotal: number;
  contratadosTotal: number;
  descartadosTotal: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type CreateVacanteRequest = {
  titulo: string;
  departamentoId: number;
  puestoId: number;
  sucursalId: number;
  numeroPosiciones: number;
  descripcion?: string | null;
  perfil?: string | null;
  salarioMinimo?: number | null;
  salarioMaximo?: number | null;
  fechaApertura: string;
  crearComoBorrador: boolean;
  activo: boolean;
};

export type UpdateVacanteRequest = {
  titulo: string;
  departamentoId: number;
  puestoId: number;
  sucursalId: number;
  numeroPosiciones: number;
  descripcion?: string | null;
  perfil?: string | null;
  salarioMinimo?: number | null;
  salarioMaximo?: number | null;
  fechaApertura: string;
  activo: boolean;
};

export type CandidatoListItem = {
  id: number;
  nombreCompleto: string;
  telefono?: string | null;
  email?: string | null;
  fuenteReclutamiento?: string | null;
  pretensionSalarial?: number | null;
  tieneCv: boolean;
  activo: boolean;
  createdAtUtc: string;
};

export type CandidatoDetail = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  nombreCompleto: string;
  telefono?: string | null;
  email?: string | null;
  fechaNacimiento?: string | null;
  ciudad?: string | null;
  fuenteReclutamiento?: string | null;
  resumenPerfil?: string | null;
  pretensionSalarial?: number | null;
  tieneCv: boolean;
  cvNombreOriginal?: string | null;
  cvMimeType?: string | null;
  cvTamanoBytes?: number | null;
  activo: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type CreateCandidatoRequest = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaNacimiento?: string | null;
  ciudad?: string | null;
  fuenteReclutamiento?: string | null;
  resumenPerfil?: string | null;
  pretensionSalarial?: number | null;
  activo: boolean;
};

export type UpdateCandidatoRequest = CreateCandidatoRequest;

export type PostulacionListItem = {
  id: number;
  vacanteId: number;
  vacanteFolio: string;
  vacanteTitulo: string;
  candidatoId: number;
  candidatoNombre: string;
  etapaActual: EtapaPostulacion;
  fechaPostulacionUtc: string;
  fechaUltimoMovimientoUtc: string;
  esContratado: boolean;
  empleadoId?: number | null;
  activo: boolean;
};

export type PostulacionSeguimiento = {
  id: number;
  etapaAnterior?: EtapaPostulacion | null;
  etapaNueva: EtapaPostulacion;
  comentario?: string | null;
  creadoPorUserId?: number | null;
  createdAtUtc: string;
};

export type PostulacionDetail = {
  id: number;
  vacanteId: number;
  vacanteFolio: string;
  vacanteTitulo: string;
  candidatoId: number;
  candidatoNombre: string;
  candidatoTelefono?: string | null;
  candidatoEmail?: string | null;
  etapaActual: EtapaPostulacion;
  fechaPostulacionUtc: string;
  fechaUltimoMovimientoUtc: string;
  observacionesInternas?: string | null;
  motivoDescarte?: string | null;
  esContratado: boolean;
  empleadoId?: number | null;
  fechaContratacionUtc?: string | null;
  activo: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  seguimiento: PostulacionSeguimiento[];
};

export type CreatePostulacionRequest = {
  vacanteId: number;
  candidatoId: number;
  observacionesInternas?: string | null;
};

export type MoverPostulacionEtapaRequest = {
  etapaNueva: EtapaPostulacion;
  comentario?: string | null;
};

export type DescartarPostulacionRequest = {
  motivoDescarte: string;
  comentario?: string | null;
};

export type ContratarPostulacionRequest = {
  comentario?: string | null;
};

export type ConvertirPostulacionAEmpleadoRequest = {
  departamentoId: number;
  puestoId: number;
  sucursalId: number;
  fechaIngreso: string;
  activo: boolean;
};

function unwrapCollection<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.items,
    payload?.Items,
    payload?.data,
    payload?.Data,
    payload?.results,
    payload?.Results,
    payload?.value,
    payload?.Value,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeCatalogItems(data: any[]): CatalogoItem[] {
  return (data ?? [])
    .map((item) => ({
      id: toNumber(item?.id ?? item?.Id),
      nombre: String(
        item?.nombre ??
          item?.Nombre ??
          item?.name ??
          item?.Name ??
          item?.titulo ??
          item?.Titulo ??
          ""
      ).trim(),
      activo:
        typeof (item?.activo ?? item?.Activo) === "boolean"
          ? Boolean(item?.activo ?? item?.Activo)
          : undefined,
      departamentoId: toNullableNumber(
        item?.departamentoId ?? item?.DepartamentoId
      ),
    }))
    .filter((item) => item.id > 0 && item.nombre.length > 0);
}

export async function getDepartamentosCatalogo(): Promise<CatalogoItem[]> {
  const { data } = await api.get("/api/Departamentos");
  return normalizeCatalogItems(unwrapCollection(data));
}

export async function getPuestosCatalogo(): Promise<CatalogoItem[]> {
  const { data } = await api.get("/api/Puestos");
  return normalizeCatalogItems(unwrapCollection(data));
}

export async function getSucursalesCatalogo(): Promise<CatalogoItem[]> {
  const { data } = await api.get("/api/Sucursales");
  return normalizeCatalogItems(unwrapCollection(data));
}

export async function getVacantes(params?: {
  q?: string;
  estatus?: EstatusVacante | "";
  departamentoId?: number | "";
  puestoId?: number | "";
  sucursalId?: number | "";
  soloActivas?: boolean;
}): Promise<VacanteListItem[]> {
  const { data } = await api.get("/api/Vacantes", { params });
  return unwrapCollection<VacanteListItem>(data);
}

export async function getVacanteById(id: number): Promise<VacanteDetail> {
  const { data } = await api.get<VacanteDetail>(`/api/Vacantes/${id}`);
  return data;
}

export async function createVacante(payload: CreateVacanteRequest) {
  const { data } = await api.post("/api/Vacantes", payload);
  return data;
}

export async function updateVacante(id: number, payload: UpdateVacanteRequest) {
  await api.put(`/api/Vacantes/${id}`, payload);
}

export async function abrirVacante(id: number) {
  await api.post(`/api/Vacantes/${id}/abrir`);
}

export async function pausarVacante(id: number) {
  await api.post(`/api/Vacantes/${id}/pausar`);
}

export async function cerrarVacante(id: number) {
  await api.post(`/api/Vacantes/${id}/cerrar`);
}

export async function cancelarVacante(id: number) {
  await api.post(`/api/Vacantes/${id}/cancelar`);
}

export async function getCandidatos(params?: {
  q?: string;
  fuenteReclutamiento?: string;
  soloActivos?: boolean;
}): Promise<CandidatoListItem[]> {
  const { data } = await api.get("/api/Candidatos", { params });
  return unwrapCollection<CandidatoListItem>(data);
}

export async function getCandidatoById(id: number): Promise<CandidatoDetail> {
  const { data } = await api.get<CandidatoDetail>(`/api/Candidatos/${id}`);
  return data;
}

export async function createCandidato(payload: CreateCandidatoRequest) {
  const { data } = await api.post("/api/Candidatos", payload);
  return data;
}

export async function updateCandidato(
  id: number,
  payload: UpdateCandidatoRequest
) {
  await api.put(`/api/Candidatos/${id}`, payload);
}

export async function uploadCandidatoCv(id: number, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const { data } = await api.post(`/api/Candidatos/${id}/cv`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function downloadCandidatoCv(id: number): Promise<Blob> {
  const { data } = await api.get(`/api/Candidatos/${id}/cv`, {
    responseType: "blob",
  });
  return data;
}

export async function deleteCandidatoCv(id: number) {
  await api.delete(`/api/Candidatos/${id}/cv`);
}

export async function getPostulaciones(params?: {
  q?: string;
  vacanteId?: number;
  etapa?: EtapaPostulacion | "";
  esContratado?: boolean | "";
  soloActivas?: boolean;
}): Promise<PostulacionListItem[]> {
  const { data } = await api.get("/api/Postulaciones", { params });
  return unwrapCollection<PostulacionListItem>(data);
}

export async function getPostulacionById(id: number): Promise<PostulacionDetail> {
  const { data } = await api.get<PostulacionDetail>(`/api/Postulaciones/${id}`);
  return data;
}

export async function getSeguimientoPostulacion(
  id: number
): Promise<PostulacionSeguimiento[]> {
  const { data } = await api.get(`/api/Postulaciones/${id}/seguimiento`);
  return unwrapCollection<PostulacionSeguimiento>(data);
}

export async function createPostulacion(payload: CreatePostulacionRequest) {
  const { data } = await api.post("/api/Postulaciones", payload);
  return data;
}

export async function moverPostulacionEtapa(
  id: number,
  payload: MoverPostulacionEtapaRequest
) {
  await api.post(`/api/Postulaciones/${id}/mover-etapa`, payload);
}

export async function descartarPostulacion(
  id: number,
  payload: DescartarPostulacionRequest
) {
  await api.post(`/api/Postulaciones/${id}/descartar`, payload);
}

export async function contratarPostulacion(
  id: number,
  payload: ContratarPostulacionRequest
) {
  await api.post(`/api/Postulaciones/${id}/contratar`, payload);
}

export async function convertirPostulacionAEmpleado(
  id: number,
  payload: ConvertirPostulacionAEmpleadoRequest
) {
  const { data } = await api.post(
    `/api/Postulaciones/${id}/convertir-a-empleado`,
    payload
  );

  return data as { id: number; numEmpleado: string; postulacionId: number };
}

export const etapaOrder: EtapaPostulacion[] = [
  "POSTULADO",
  "FILTRO_RH",
  "ENTREVISTA_RH",
  "ENTREVISTA_LIDER",
  "OFERTA",
  "CONTRATADO",
  "DESCARTADO",
];

export const etapaLabels: Record<EtapaPostulacion, string> = {
  POSTULADO: "Postulado",
  FILTRO_RH: "Filtro RH",
  ENTREVISTA_RH: "Entrevista RH",
  ENTREVISTA_LIDER: "Entrevista líder",
  OFERTA: "Oferta",
  CONTRATADO: "Contratado",
  DESCARTADO: "Descartado",
};

export const estatusVacanteLabels: Record<EstatusVacante, string> = {
  BORRADOR: "Borrador",
  ABIERTA: "Abierta",
  PAUSADA: "Pausada",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};