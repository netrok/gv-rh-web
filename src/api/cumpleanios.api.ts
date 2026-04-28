import { api } from "./axios";

export type CumpleaniosItem = {
  empleadoId: number;
  numEmpleado: string;
  nombreCompleto: string;
  fechaNacimiento?: string | null;
  dia: number;
  mes: number;
  edadQueCumple: number;
  sucursalNombre?: string | null;
  departamentoNombre?: string | null;
  puestoNombre?: string | null;
  fotoUrl?: string | null;
  esHoy: boolean;
  diasRestantes: number;
};

export type CumpleaniosResumen = {
  hoy: number;
  proximos7Dias: number;
  esteMes: number;
};

export type CumpleaniosFiltros = {
  sucursalId?: number | null;
  departamentoId?: number | null;
};

export type CumpleaniosReporteScope =
  | "hoy"
  | "7dias"
  | "30dias"
  | "mes"
  | "custom";

export type CumpleaniosReporteQuery = {
  sucursalId?: number | null;
  departamentoId?: number | null;
  scope?: CumpleaniosReporteScope | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
};

function appendIfValue(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined
) {
  if (value === null || value === undefined || value === "") return;
  params.set(key, String(value));
}

function buildCumpleaniosReporteParams(
  query?: CumpleaniosReporteQuery
): URLSearchParams {
  const params = new URLSearchParams();

  appendIfValue(params, "sucursalId", query?.sucursalId ?? null);
  appendIfValue(params, "departamentoId", query?.departamentoId ?? null);
  appendIfValue(params, "scope", query?.scope ?? null);
  appendIfValue(params, "fechaDesde", query?.fechaDesde ?? null);
  appendIfValue(params, "fechaHasta", query?.fechaHasta ?? null);

  return params;
}

function getFileNameFromDisposition(
  contentDisposition?: string | null,
  fallback = "reporte"
): string {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
}

function downloadBlobFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function getCumpleaniosResumen(
  filtros?: CumpleaniosFiltros
): Promise<CumpleaniosResumen> {
  const { data } = await api.get<CumpleaniosResumen>("/api/Cumpleanios/resumen", {
    params: filtros,
  });

  return data;
}

export async function getCumpleaniosHoy(
  filtros?: CumpleaniosFiltros
): Promise<CumpleaniosItem[]> {
  const { data } = await api.get<CumpleaniosItem[]>("/api/Cumpleanios/hoy", {
    params: filtros,
  });

  return data;
}

export async function getCumpleaniosProximos(
  dias = 30,
  filtros?: CumpleaniosFiltros
): Promise<CumpleaniosItem[]> {
  const { data } = await api.get<CumpleaniosItem[]>("/api/Cumpleanios/proximos", {
    params: { dias, ...filtros },
  });

  return data;
}

export async function getCumpleaniosMes(
  mes?: number,
  anio?: number,
  filtros?: CumpleaniosFiltros
): Promise<CumpleaniosItem[]> {
  const { data } = await api.get<CumpleaniosItem[]>("/api/Cumpleanios/mes", {
    params: { mes, anio, ...filtros },
  });

  return data;
}

export async function exportCumpleaniosXlsx(
  query?: CumpleaniosReporteQuery
): Promise<void> {
  const params = buildCumpleaniosReporteParams(query);

  const response = await api.get<Blob>("/api/Cumpleanios/export/xlsx", {
    params,
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "cumpleanios.xlsx"
  );

  downloadBlobFile(response.data, fileName);
}

export async function exportCumpleaniosPdf(
  query?: CumpleaniosReporteQuery
): Promise<void> {
  const params = buildCumpleaniosReporteParams(query);

  const response = await api.get<Blob>("/api/Cumpleanios/export/pdf", {
    params,
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "cumpleanios.pdf"
  );

  downloadBlobFile(response.data, fileName);
}