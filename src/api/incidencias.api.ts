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
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  comentario?: string | null;
  estatus: string;
  tieneEvidencia: boolean;
  evidenciaNombreOriginal?: string | null;
  evidenciaContentType?: string | null;
  evidenciaTamanoBytes?: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type IncidenciaEvidencia = {
  tieneEvidencia: boolean;
  evidenciaNombreOriginal?: string | null;
  evidenciaContentType?: string | null;
  evidenciaTamanoBytes?: number | null;
};

export type IncidenciaQuery = {
  empleadoId?: number;
  sucursalId?: number;
  tipo?: string;
  estatus?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloPendientes?: boolean;
};

export type SaveIncidenciaInput = {
  empleadoId: number;
  sucursalId?: number | null;
  tipo: string;
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
  const { data } = await api.put<Incidencia>(`/api/Incidencias/${id}`, input);
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

export async function uploadIncidenciaEvidencia(
  id: number,
  file: File
): Promise<IncidenciaEvidencia> {
  const formData = new FormData();
  formData.append("archivo", file);

  const { data } = await api.post<IncidenciaEvidencia>(
    `/api/Incidencias/${id}/evidencia`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function downloadIncidenciaEvidencia(id: number): Promise<Blob> {
  const { data } = await api.get(`/api/Incidencias/${id}/evidencia`, {
    responseType: "blob",
  });

  return data;
}

export async function deleteIncidenciaEvidencia(id: number): Promise<void> {
  await api.delete(`/api/Incidencias/${id}/evidencia`);
}

export async function saveIncidenciaEvidenciaToDisk(
  id: number,
  fileName = "evidencia"
): Promise<void> {
  const blob = await downloadIncidenciaEvidencia(id);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}