import { api } from "./axios";

export type VacacionesSaldosReporteQuery = {
  sucursalId?: number | null;
  departamentoId?: number | null;
  puestoId?: number | null;
  empleadoId?: number | null;
  estatusLaboral?: string | null;
  fechaCorte?: string | null;
  soloConSaldo?: boolean | null;
  soloVencidos?: boolean | null;
  soloActivos?: boolean | null;
  search?: string | null;
};

export type VacacionesSaldosReporteRow = {
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;

  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;

  estatusLaboral: string;
  activo: boolean;

  fechaIngreso: string;

  vacacionPeriodoId: number;
  anioServicio: number;

  fechaInicio: string;
  fechaFin: string;
  fechaLimiteDisfrute: string;

  diasDerecho: number;
  diasTomados: number;
  diasPagados: number;
  diasAjustados: number;
  diasVencidos: number;
  saldo: number;

  estatusPeriodo: string;
  primaPagada: boolean;

  estaVencido: boolean;
  diasParaVencer: number;
};

export type VacacionesSaldosReporteResult = {
  fechaCorte: string;

  totalRegistros: number;
  empleadosConSaldo: number;
  periodosVencidos: number;

  totalDiasDerecho: number;
  totalDiasTomados: number;
  totalDiasPagados: number;
  totalDiasVencidos: number;
  totalSaldo: number;

  items: VacacionesSaldosReporteRow[];
};

function appendIfValue(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value === null || value === undefined || value === "") return;
  params.set(key, String(value));
}

function buildVacacionesSaldosParams(
  query?: VacacionesSaldosReporteQuery
): URLSearchParams {
  const params = new URLSearchParams();

  appendIfValue(params, "sucursalId", query?.sucursalId ?? null);
  appendIfValue(params, "departamentoId", query?.departamentoId ?? null);
  appendIfValue(params, "puestoId", query?.puestoId ?? null);
  appendIfValue(params, "empleadoId", query?.empleadoId ?? null);
  appendIfValue(params, "estatusLaboral", query?.estatusLaboral ?? null);
  appendIfValue(params, "fechaCorte", query?.fechaCorte ?? null);
  appendIfValue(params, "soloConSaldo", query?.soloConSaldo ?? null);
  appendIfValue(params, "soloVencidos", query?.soloVencidos ?? null);
  appendIfValue(params, "soloActivos", query?.soloActivos ?? null);
  appendIfValue(params, "search", query?.search ?? null);

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

export async function getVacacionesSaldosReporte(
  query?: VacacionesSaldosReporteQuery
): Promise<VacacionesSaldosReporteResult> {
  const params = buildVacacionesSaldosParams(query);

  const { data } = await api.get<VacacionesSaldosReporteResult>(
    "/api/Vacaciones/reportes/saldos",
    { params }
  );

  return data;
}

export async function exportVacacionesSaldosXlsx(
  query?: VacacionesSaldosReporteQuery
): Promise<void> {
  const params = buildVacacionesSaldosParams(query);

  const response = await api.get<Blob>(
    "/api/Vacaciones/reportes/saldos/export/xlsx",
    {
      params,
      responseType: "blob",
    }
  );

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "vacaciones_saldos.xlsx"
  );

  downloadBlobFile(response.data, fileName);
}

export async function exportVacacionesSaldosPdf(
  query?: VacacionesSaldosReporteQuery
): Promise<void> {
  const params = buildVacacionesSaldosParams(query);

  const response = await api.get<Blob>(
    "/api/Vacaciones/reportes/saldos/export/pdf",
    {
      params,
      responseType: "blob",
    }
  );

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "vacaciones_saldos.pdf"
  );

  downloadBlobFile(response.data, fileName);
}

export function getEstatusLaboralLabel(value?: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "ACTIVO":
      return "Activo";
    case "BAJA":
      return "Baja";
    case "REINGRESO":
      return "Reingreso";
    default:
      return value || "Sin estatus";
  }
}

export function getEstatusPeriodoLabel(value?: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "ABIERTO":
      return "Abierto";
    case "CERRADO":
      return "Cerrado";
    case "VENCIDO":
      return "Vencido";
    case "CANCELADO":
      return "Cancelado";
    default:
      return value || "Sin estatus";
  }
}