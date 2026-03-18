import { api } from "./axios";

export type CatalogoOption = {
  id: number;
  clave: string;
  nombre: string;
};

export type Incidencia = {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  tipo: number;
  fechaInicio: string;
  fechaFin: string;
  comentario?: string | null;
  estatus: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type IncidenciaQuery = {
  empleadoId?: number;
  sucursalId?: number;
  tipo?: number;
  estatus?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  soloPendientes?: boolean;
};

export type SaveIncidenciaInput = {
  empleadoId: number;
  sucursalId?: number | null;
  tipo: number;
  fechaInicio: string;
  fechaFin: string;
  comentario?: string | null;
};

function cleanQuery(query?: IncidenciaQuery) {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getIncidencias(
  query?: IncidenciaQuery
): Promise<Incidencia[]> {
  const { data } = await api.get<Incidencia[]>("/api/Incidencias", {
    params: cleanQuery(query),
  });
  return data;
}

export async function getIncidenciaById(id: number): Promise<Incidencia> {
  const { data } = await api.get<Incidencia>(`/api/Incidencias/${id}`);
  return data;
}

export async function createIncidencia(
  input: SaveIncidenciaInput
): Promise<Incidencia> {
  const { data } = await api.post<Incidencia>("/api/Incidencias", input);
  return data;
}

export async function updateIncidencia(
  id: number,
  input: SaveIncidenciaInput
): Promise<Incidencia> {
  const { data } = await api.put<Incidencia>(
    `/api/Incidencias/${id}`,
    input
  );
  return data;
}

export async function aprobarIncidencia(id: number): Promise<void> {
  await api.post(`/api/Incidencias/${id}/aprobar`);
}

export async function rechazarIncidencia(id: number): Promise<void> {
  await api.post(`/api/Incidencias/${id}/rechazar`);
}

export async function getTiposIncidencia(): Promise<CatalogoOption[]> {
  const { data } = await api.get<CatalogoOption[]>(
    "/api/Incidencias/catalogos/tipos"
  );
  return data;
}

export async function getEstatusIncidencia(): Promise<CatalogoOption[]> {
  const { data } = await api.get<CatalogoOption[]>(
    "/api/Incidencias/catalogos/estatus"
  );
  return data;
}