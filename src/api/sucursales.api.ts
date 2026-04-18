import type { AxiosResponse } from "axios";
import { api } from "./axios";

export type SucursalDto = {
  id: number;
  clave: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
  empleadosActivos: number;
};

export type SucursalCreateDto = {
  clave: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
};

export type SucursalUpdateDto = SucursalCreateDto;

export type SucursalQueryParams = {
  activo?: boolean;
  q?: string;
};

export type SucursalReporteQuery = {
  activo?: boolean;
  q?: string;
};

type SucursalListEnvelope =
  | SucursalDto[]
  | {
      items?: SucursalDto[];
      data?: SucursalDto[];
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };

function normalizeSucursales(payload: SucursalListEnvelope): SucursalDto[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function cleanReportQuery(query?: SucursalReporteQuery) {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

function buildExportParams(filters?: SucursalReporteQuery) {
  const cleaned = cleanReportQuery(filters);
  const params = new URLSearchParams();

  if (!cleaned) return "";

  Object.entries(cleaned).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  return params.toString();
}

export async function getSucursales(
  params?: SucursalQueryParams
): Promise<SucursalDto[]> {
  const { data } = await api.get<SucursalListEnvelope>("/api/Sucursales", {
    params: {
      page: 1,
      pageSize: 500,
      sort: "nombre",
      dir: "asc",
      ...params,
    },
  });

  return normalizeSucursales(data);
}

export async function getSucursalById(id: number): Promise<SucursalDto> {
  const { data } = await api.get<SucursalDto>(`/api/Sucursales/${id}`);
  return data;
}

export async function createSucursal(
  payload: SucursalCreateDto
): Promise<SucursalDto> {
  const { data } = await api.post<SucursalDto>("/api/Sucursales", payload);
  return data;
}

export async function updateSucursal(
  id: number,
  payload: SucursalUpdateDto
): Promise<SucursalDto> {
  const { data } = await api.put<SucursalDto>(`/api/Sucursales/${id}`, payload);
  return data;
}

export async function deleteSucursal(id: number): Promise<void> {
  await api.delete(`/api/Sucursales/${id}`);
}

export async function exportSucursalesXlsx(
  filters?: SucursalReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Sucursales/export/xlsx${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });
}

export async function exportSucursalesPdf(
  filters?: SucursalReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Sucursales/export/pdf${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });
}

export function getFileNameFromDisposition(
  disposition: string | undefined,
  fallback: string
) {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return fallback;
}

export function downloadBlobFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}