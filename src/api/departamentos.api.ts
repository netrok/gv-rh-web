import type { AxiosResponse } from "axios";
import { api } from "./axios";

export type Departamento = {
  id: number;
  clave: string;
  nombre: string;
  activo: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type SaveDepartamentoInput = {
  clave: string;
  nombre: string;
  activo: boolean;
};

export type DepartamentoReporteQuery = {
  q?: string;
  activo?: boolean;
};

type DepartamentoListEnvelope =
  | Departamento[]
  | {
      items?: Departamento[];
      data?: Departamento[];
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };

function normalizeDepartamentos(
  payload: DepartamentoListEnvelope
): Departamento[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function cleanReportQuery(query?: DepartamentoReporteQuery) {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

function buildExportParams(filters?: DepartamentoReporteQuery) {
  const cleaned = cleanReportQuery(filters);
  const params = new URLSearchParams();

  if (!cleaned) return "";

  Object.entries(cleaned).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  return params.toString();
}

export async function getDepartamentos() {
  const { data } = await api.get<DepartamentoListEnvelope>(
    "/api/Departamentos?page=1&pageSize=500&sort=nombre&dir=asc"
  );

  return normalizeDepartamentos(data);
}

export async function createDepartamento(input: SaveDepartamentoInput) {
  const { data } = await api.post<Departamento>("/api/Departamentos", input);
  return data;
}

export async function updateDepartamento(
  id: number,
  input: SaveDepartamentoInput
) {
  const { data } = await api.put<Departamento>(
    `/api/Departamentos/${id}`,
    input
  );
  return data;
}

export async function exportDepartamentosXlsx(
  filters?: DepartamentoReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Departamentos/export/xlsx${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });
}

export async function exportDepartamentosPdf(
  filters?: DepartamentoReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Departamentos/export/pdf${query ? `?${query}` : ""}`, {
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