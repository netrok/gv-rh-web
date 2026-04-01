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

const collectionKeys = [
  "items",
  "Items",
  "data",
  "Data",
  "results",
  "Results",
  "value",
  "Value",
  "rows",
  "Rows",
  "$values",
] as const;

const objectKeys = [
  "item",
  "Item",
  "data",
  "Data",
  "result",
  "Result",
  "value",
  "Value",
] as const;

function firstDefined<T>(...values: T[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "si", "sí", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const parsed = toStringValue(value, "");
  return parsed.length > 0 ? parsed : null;
}

function normalizeEstatusVacante(value: unknown): EstatusVacante {
  const normalized = toStringValue(value, "BORRADOR").toUpperCase();

  if (
    normalized === "BORRADOR" ||
    normalized === "ABIERTA" ||
    normalized === "PAUSADA" ||
    normalized === "CERRADA" ||
    normalized === "CANCELADA"
  ) {
    return normalized;
  }

  return "BORRADOR";
}

function normalizeEtapaPostulacion(value: unknown): EtapaPostulacion {
  const normalized = toStringValue(value, "POSTULADO").toUpperCase();

  if (
    normalized === "POSTULADO" ||
    normalized === "FILTRO_RH" ||
    normalized === "ENTREVISTA_RH" ||
    normalized === "ENTREVISTA_LIDER" ||
    normalized === "OFERTA" ||
    normalized === "CONTRATADO" ||
    normalized === "DESCARTADO"
  ) {
    return normalized;
  }

  return "POSTULADO";
}

function unwrapCollection<T = any>(payload: any): T[] {
  const visited = new Set<any>();

  function walk(node: any): T[] {
    if (!node) return [];
    if (Array.isArray(node)) return node;

    if (typeof node !== "object") return [];
    if (visited.has(node)) return [];

    visited.add(node);

    for (const key of collectionKeys) {
      const candidate = node?.[key];

      if (Array.isArray(candidate)) return candidate;

      if (candidate && typeof candidate === "object") {
        const nested = walk(candidate);
        if (nested.length > 0) return nested;
      }
    }

    return [];
  }

  return walk(payload);
}

function unwrapObject<T = any>(payload: any): T {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload as T;
  }

  for (const key of objectKeys) {
    const candidate = payload?.[key];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return unwrapObject<T>(candidate);
    }
  }

  return payload as T;
}

function normalizeCatalogItem(item: any): CatalogoItem {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    nombre: toStringValue(
      firstDefined(
        item?.nombre,
        item?.Nombre,
        item?.name,
        item?.Name,
        item?.titulo,
        item?.Titulo
      ),
      ""
    ),
    activo:
      firstDefined(item?.activo, item?.Activo) === undefined
        ? undefined
        : toBoolean(firstDefined(item?.activo, item?.Activo)),
    departamentoId: toNullableNumber(
      firstDefined(item?.departamentoId, item?.DepartamentoId)
    ),
  };
}

function normalizeCatalogItems(data: any[]): CatalogoItem[] {
  return (data ?? [])
    .map(normalizeCatalogItem)
    .filter((item) => item.id > 0 && item.nombre.length > 0);
}

function normalizeVacanteListItem(item: any): VacanteListItem {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    folio: toStringValue(firstDefined(item?.folio, item?.Folio)),
    titulo: toStringValue(firstDefined(item?.titulo, item?.Titulo)),
    departamentoId: toNumber(
      firstDefined(item?.departamentoId, item?.DepartamentoId)
    ),
    departamentoNombre: toStringValue(
      firstDefined(item?.departamentoNombre, item?.DepartamentoNombre)
    ),
    puestoId: toNumber(firstDefined(item?.puestoId, item?.PuestoId)),
    puestoNombre: toStringValue(
      firstDefined(item?.puestoNombre, item?.PuestoNombre)
    ),
    sucursalId: toNumber(firstDefined(item?.sucursalId, item?.SucursalId)),
    sucursalNombre: toStringValue(
      firstDefined(item?.sucursalNombre, item?.SucursalNombre)
    ),
    numeroPosiciones: toNumber(
      firstDefined(item?.numeroPosiciones, item?.NumeroPosiciones)
    ),
    posicionesCubiertas: toNumber(
      firstDefined(item?.posicionesCubiertas, item?.PosicionesCubiertas)
    ),
    fechaApertura: toStringValue(
      firstDefined(item?.fechaApertura, item?.FechaApertura)
    ),
    fechaCierre: toNullableString(
      firstDefined(item?.fechaCierre, item?.FechaCierre)
    ),
    estatus: normalizeEstatusVacante(firstDefined(item?.estatus, item?.Estatus)),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
  };
}

function normalizeVacanteDetail(item: any): VacanteDetail {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    folio: toStringValue(firstDefined(item?.folio, item?.Folio)),
    titulo: toStringValue(firstDefined(item?.titulo, item?.Titulo)),
    departamentoId: toNumber(
      firstDefined(item?.departamentoId, item?.DepartamentoId)
    ),
    departamentoNombre: toStringValue(
      firstDefined(item?.departamentoNombre, item?.DepartamentoNombre)
    ),
    puestoId: toNumber(firstDefined(item?.puestoId, item?.PuestoId)),
    puestoNombre: toStringValue(
      firstDefined(item?.puestoNombre, item?.PuestoNombre)
    ),
    sucursalId: toNumber(firstDefined(item?.sucursalId, item?.SucursalId)),
    sucursalNombre: toStringValue(
      firstDefined(item?.sucursalNombre, item?.SucursalNombre)
    ),
    numeroPosiciones: toNumber(
      firstDefined(item?.numeroPosiciones, item?.NumeroPosiciones)
    ),
    descripcion: toNullableString(
      firstDefined(item?.descripcion, item?.Descripcion)
    ),
    perfil: toNullableString(firstDefined(item?.perfil, item?.Perfil)),
    salarioMinimo: toNullableNumber(
      firstDefined(item?.salarioMinimo, item?.SalarioMinimo)
    ),
    salarioMaximo: toNullableNumber(
      firstDefined(item?.salarioMaximo, item?.SalarioMaximo)
    ),
    fechaApertura: toStringValue(
      firstDefined(item?.fechaApertura, item?.FechaApertura)
    ),
    fechaCierre: toNullableString(
      firstDefined(item?.fechaCierre, item?.FechaCierre)
    ),
    estatus: normalizeEstatusVacante(firstDefined(item?.estatus, item?.Estatus)),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
    postulacionesTotal: toNumber(
      firstDefined(item?.postulacionesTotal, item?.PostulacionesTotal)
    ),
    contratadosTotal: toNumber(
      firstDefined(item?.contratadosTotal, item?.ContratadosTotal)
    ),
    descartadosTotal: toNumber(
      firstDefined(item?.descartadosTotal, item?.DescartadosTotal)
    ),
    createdAtUtc: toStringValue(
      firstDefined(item?.createdAtUtc, item?.CreatedAtUtc)
    ),
    updatedAtUtc: toNullableString(
      firstDefined(item?.updatedAtUtc, item?.UpdatedAtUtc)
    ),
  };
}

function normalizeCandidatoListItem(item: any): CandidatoListItem {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    nombreCompleto: toStringValue(
      firstDefined(item?.nombreCompleto, item?.NombreCompleto)
    ),
    telefono: toNullableString(firstDefined(item?.telefono, item?.Telefono)),
    email: toNullableString(firstDefined(item?.email, item?.Email)),
    fuenteReclutamiento: toNullableString(
      firstDefined(item?.fuenteReclutamiento, item?.FuenteReclutamiento)
    ),
    pretensionSalarial: toNullableNumber(
      firstDefined(item?.pretensionSalarial, item?.PretensionSalarial)
    ),
    tieneCv: toBoolean(firstDefined(item?.tieneCv, item?.TieneCv)),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
    createdAtUtc: toStringValue(
      firstDefined(item?.createdAtUtc, item?.CreatedAtUtc)
    ),
  };
}

function normalizeCandidatoDetail(item: any): CandidatoDetail {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    nombres: toStringValue(firstDefined(item?.nombres, item?.Nombres)),
    apellidoPaterno: toStringValue(
      firstDefined(item?.apellidoPaterno, item?.ApellidoPaterno)
    ),
    apellidoMaterno: toNullableString(
      firstDefined(item?.apellidoMaterno, item?.ApellidoMaterno)
    ),
    nombreCompleto: toStringValue(
      firstDefined(item?.nombreCompleto, item?.NombreCompleto)
    ),
    telefono: toNullableString(firstDefined(item?.telefono, item?.Telefono)),
    email: toNullableString(firstDefined(item?.email, item?.Email)),
    fechaNacimiento: toNullableString(
      firstDefined(item?.fechaNacimiento, item?.FechaNacimiento)
    ),
    ciudad: toNullableString(firstDefined(item?.ciudad, item?.Ciudad)),
    fuenteReclutamiento: toNullableString(
      firstDefined(item?.fuenteReclutamiento, item?.FuenteReclutamiento)
    ),
    resumenPerfil: toNullableString(
      firstDefined(item?.resumenPerfil, item?.ResumenPerfil)
    ),
    pretensionSalarial: toNullableNumber(
      firstDefined(item?.pretensionSalarial, item?.PretensionSalarial)
    ),
    tieneCv: toBoolean(firstDefined(item?.tieneCv, item?.TieneCv)),
    cvNombreOriginal: toNullableString(
      firstDefined(item?.cvNombreOriginal, item?.CvNombreOriginal)
    ),
    cvMimeType: toNullableString(
      firstDefined(item?.cvMimeType, item?.CvMimeType)
    ),
    cvTamanoBytes: toNullableNumber(
      firstDefined(item?.cvTamanoBytes, item?.CvTamanoBytes)
    ),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
    createdAtUtc: toStringValue(
      firstDefined(item?.createdAtUtc, item?.CreatedAtUtc)
    ),
    updatedAtUtc: toNullableString(
      firstDefined(item?.updatedAtUtc, item?.UpdatedAtUtc)
    ),
  };
}

function normalizePostulacionSeguimiento(item: any): PostulacionSeguimiento {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    etapaAnterior:
      firstDefined(item?.etapaAnterior, item?.EtapaAnterior) === undefined ||
      firstDefined(item?.etapaAnterior, item?.EtapaAnterior) === null ||
      firstDefined(item?.etapaAnterior, item?.EtapaAnterior) === ""
        ? null
        : normalizeEtapaPostulacion(
            firstDefined(item?.etapaAnterior, item?.EtapaAnterior)
          ),
    etapaNueva: normalizeEtapaPostulacion(
      firstDefined(item?.etapaNueva, item?.EtapaNueva)
    ),
    comentario: toNullableString(
      firstDefined(item?.comentario, item?.Comentario)
    ),
    creadoPorUserId: toNullableNumber(
      firstDefined(item?.creadoPorUserId, item?.CreadoPorUserId)
    ),
    createdAtUtc: toStringValue(
      firstDefined(item?.createdAtUtc, item?.CreatedAtUtc)
    ),
  };
}

function normalizePostulacionListItem(item: any): PostulacionListItem {
  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    vacanteId: toNumber(firstDefined(item?.vacanteId, item?.VacanteId)),
    vacanteFolio: toStringValue(
      firstDefined(item?.vacanteFolio, item?.VacanteFolio)
    ),
    vacanteTitulo: toStringValue(
      firstDefined(item?.vacanteTitulo, item?.VacanteTitulo)
    ),
    candidatoId: toNumber(firstDefined(item?.candidatoId, item?.CandidatoId)),
    candidatoNombre: toStringValue(
      firstDefined(item?.candidatoNombre, item?.CandidatoNombre)
    ),
    etapaActual: normalizeEtapaPostulacion(
      firstDefined(item?.etapaActual, item?.EtapaActual)
    ),
    fechaPostulacionUtc: toStringValue(
      firstDefined(item?.fechaPostulacionUtc, item?.FechaPostulacionUtc)
    ),
    fechaUltimoMovimientoUtc: toStringValue(
      firstDefined(item?.fechaUltimoMovimientoUtc, item?.FechaUltimoMovimientoUtc)
    ),
    esContratado: toBoolean(
      firstDefined(item?.esContratado, item?.EsContratado)
    ),
    empleadoId: toNullableNumber(firstDefined(item?.empleadoId, item?.EmpleadoId)),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
  };
}

function normalizePostulacionDetail(item: any): PostulacionDetail {
  const seguimientoRaw = unwrapCollection<any>(
    firstDefined(item?.seguimiento, item?.Seguimiento) ?? []
  );

  return {
    id: toNumber(firstDefined(item?.id, item?.Id)),
    vacanteId: toNumber(firstDefined(item?.vacanteId, item?.VacanteId)),
    vacanteFolio: toStringValue(
      firstDefined(item?.vacanteFolio, item?.VacanteFolio)
    ),
    vacanteTitulo: toStringValue(
      firstDefined(item?.vacanteTitulo, item?.VacanteTitulo)
    ),
    candidatoId: toNumber(firstDefined(item?.candidatoId, item?.CandidatoId)),
    candidatoNombre: toStringValue(
      firstDefined(item?.candidatoNombre, item?.CandidatoNombre)
    ),
    candidatoTelefono: toNullableString(
      firstDefined(item?.candidatoTelefono, item?.CandidatoTelefono)
    ),
    candidatoEmail: toNullableString(
      firstDefined(item?.candidatoEmail, item?.CandidatoEmail)
    ),
    etapaActual: normalizeEtapaPostulacion(
      firstDefined(item?.etapaActual, item?.EtapaActual)
    ),
    fechaPostulacionUtc: toStringValue(
      firstDefined(item?.fechaPostulacionUtc, item?.FechaPostulacionUtc)
    ),
    fechaUltimoMovimientoUtc: toStringValue(
      firstDefined(item?.fechaUltimoMovimientoUtc, item?.FechaUltimoMovimientoUtc)
    ),
    observacionesInternas: toNullableString(
      firstDefined(item?.observacionesInternas, item?.ObservacionesInternas)
    ),
    motivoDescarte: toNullableString(
      firstDefined(item?.motivoDescarte, item?.MotivoDescarte)
    ),
    esContratado: toBoolean(
      firstDefined(item?.esContratado, item?.EsContratado)
    ),
    empleadoId: toNullableNumber(firstDefined(item?.empleadoId, item?.EmpleadoId)),
    fechaContratacionUtc: toNullableString(
      firstDefined(item?.fechaContratacionUtc, item?.FechaContratacionUtc)
    ),
    activo: toBoolean(firstDefined(item?.activo, item?.Activo), true),
    createdAtUtc: toStringValue(
      firstDefined(item?.createdAtUtc, item?.CreatedAtUtc)
    ),
    updatedAtUtc: toNullableString(
      firstDefined(item?.updatedAtUtc, item?.UpdatedAtUtc)
    ),
    seguimiento: seguimientoRaw.map(normalizePostulacionSeguimiento),
  };
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
  return unwrapCollection<any>(data).map(normalizeVacanteListItem);
}

export async function getVacanteById(id: number): Promise<VacanteDetail> {
  const { data } = await api.get(`/api/Vacantes/${id}`);
  return normalizeVacanteDetail(unwrapObject(data));
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
  return unwrapCollection<any>(data).map(normalizeCandidatoListItem);
}

export async function getCandidatoById(id: number): Promise<CandidatoDetail> {
  const { data } = await api.get(`/api/Candidatos/${id}`);
  return normalizeCandidatoDetail(unwrapObject(data));
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
  return unwrapCollection<any>(data).map(normalizePostulacionListItem);
}

export async function getPostulacionById(id: number): Promise<PostulacionDetail> {
  const { data } = await api.get(`/api/Postulaciones/${id}`);
  return normalizePostulacionDetail(unwrapObject(data));
}

export async function getSeguimientoPostulacion(
  id: number
): Promise<PostulacionSeguimiento[]> {
  const { data } = await api.get(`/api/Postulaciones/${id}/seguimiento`);
  return unwrapCollection<any>(data).map(normalizePostulacionSeguimiento);
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

  const entity = unwrapObject<any>(data);

  return {
    id: toNumber(firstDefined(entity?.id, entity?.Id)),
    numEmpleado: toStringValue(
      firstDefined(entity?.numEmpleado, entity?.NumEmpleado)
    ),
    postulacionId: toNumber(
      firstDefined(entity?.postulacionId, entity?.PostulacionId)
    ),
  };
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