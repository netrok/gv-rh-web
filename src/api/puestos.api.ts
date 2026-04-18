import type { AxiosResponse } from "axios";
import { api } from "./axios";

export type Puesto = {
  id: number;
  clave: string;
  nombre: string;
  departamentoId: number;
  activo: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type SavePuestoInput = {
  clave: string;
  nombre: string;
  departamentoId: number;
  activo: boolean;
};

export type PuestoReporteQuery = {
  q?: string;
  activo?: boolean;
  departamentoId?: number;
};

type RawPuesto = {
  id?: number | string;
  clave?: string;
  nombre?: string;
  departamentoId?: number | string | null;
  departamentoID?: number | string | null;
  departamento?: {
    id?: number | string | null;
  } | null;
  activo?: boolean | string | number;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

type PuestoListEnvelope =
  | RawPuesto[]
  | {
      items?: RawPuesto[];
      data?: RawPuesto[];
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}

function normalizePuesto(raw: RawPuesto): Puesto {
  return {
    id: toNumber(raw.id),
    clave: raw.clave ?? "",
    nombre: raw.nombre ?? "",
    departamentoId: toNumber(
      raw.departamentoId ?? raw.departamentoID ?? raw.departamento?.id ?? 0
    ),
    activo: toBoolean(raw.activo),
    createdAtUtc: raw.createdAtUtc,
    updatedAtUtc: raw.updatedAtUtc,
  };
}

function normalizePuestos(payload: PuestoListEnvelope): Puesto[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload.items ?? payload.data ?? [];

  return rows.map(normalizePuesto);
}

function cleanReportQuery(query?: PuestoReporteQuery) {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

function buildExportParams(filters?: PuestoReporteQuery) {
  const cleaned = cleanReportQuery(filters);
  const params = new URLSearchParams();

  if (!cleaned) return "";

  Object.entries(cleaned).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  return params.toString();
}

export async function getPuestos() {
  const { data } = await api.get<PuestoListEnvelope>("/api/Puestos", {
    params: {
      page: 1,
      pageSize: 500,
      sort: "nombre",
      dir: "asc",
    },
  });

  return normalizePuestos(data);
}

export async function createPuesto(input: SavePuestoInput) {
  const { data } = await api.post<Puesto>("/api/Puestos", input);
  return data;
}

export async function updatePuesto(id: number, input: SavePuestoInput) {
  const { data } = await api.put<Puesto>(`/api/Puestos/${id}`, input);
  return data;
}

export async function exportPuestosXlsx(
  filters?: PuestoReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Puestos/export/xlsx${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });
}

export async function exportPuestosPdf(
  filters?: PuestoReporteQuery
): Promise<AxiosResponse<Blob>> {
  const query = buildExportParams(filters);

  return api.get(`/api/Puestos/export/pdf${query ? `?${query}` : ""}`, {
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