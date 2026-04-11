import { api } from "./axios";

export type EstatusLaboralEmpleado = "ACTIVO" | "BAJA";

export type TipoBajaEmpleado =
  | "VOLUNTARIA"
  | "INVOLUNTARIA"
  | "TERMINO_CONTRATO"
  | "ABANDONO"
  | "JUBILACION"
  | "DEFUNCION"
  | "OTRA";

export type Empleado = {
  id: number;
  numEmpleado: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;

  estatusLaboralActual: EstatusLaboralEmpleado;
  fechaBajaActual?: string | null;
  tipoBajaActual?: TipoBajaEmpleado | null;
  fechaReingresoActual?: string | null;
  recontratable?: boolean | null;

  departamentoId?: number | null;
  departamentoNombre?: string | null;

  puestoId?: number | null;
  puestoNombre?: string | null;

  sucursalId?: number | null;
  sucursalNombre?: string | null;
};

export type SaveEmpleadoInput = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;
  departamentoId: number;
  puestoId: number;
  sucursalId?: number | null;
};

export type GetEmpleadosParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  activo?: boolean;
  departamentoId?: number;
  puestoId?: number;
  sucursalId?: number;
  sort?: string;
  dir?: "asc" | "desc";
};

export type EmpleadoListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Empleado[];
};

export type EmpleadoMovimientoLaboral = {
  id: number;
  empleadoId: number;
  tipoMovimiento:
    | "ALTA"
    | "BAJA"
    | "REINGRESO"
    | "CAMBIO_PUESTO"
    | "CAMBIO_DEPARTAMENTO"
    | "CAMBIO_SUCURSAL"
    | "CAMBIO_SALARIO";
  fechaMovimiento: string;
  tipoBaja?: TipoBajaEmpleado | null;
  motivo?: string | null;
  comentario?: string | null;
  recontratable?: boolean | null;
  usuarioResponsableId?: number | null;
  createdAtUtc: string;
};

export type DarBajaEmpleadoInput = {
  fechaBaja: string;
  tipoBaja: TipoBajaEmpleado;
  motivo?: string | null;
  comentario?: string | null;
  recontratable?: boolean | null;
  desactivarUsuario?: boolean;
};

export type ReingresarEmpleadoInput = {
  fechaReingreso: string;
  departamentoId?: number | null;
  puestoId?: number | null;
  sucursalId?: number | null;
  comentario?: string | null;
  reactivarUsuario?: boolean;
};

export type EmpleadosReporteParams = {
  sucursalId?: number | null;
  departamentoId?: number | null;
  puestoId?: number | null;
  activo?: boolean | null;
  estatusLaboral?: string | null;
  fechaIngresoDesde?: string | null;
  fechaIngresoHasta?: string | null;
  search?: string | null;
};

type EmpleadoListEnvelope =
  | Empleado[]
  | {
      items?: Empleado[];
      data?: Empleado[];
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };

function normalizeEmpleados(payload: EmpleadoListEnvelope): Empleado[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function normalizeEmpleadoListResponse(
  payload: EmpleadoListEnvelope,
  requestedPage = 1,
  requestedPageSize = 20
): EmpleadoListResponse {
  if (Array.isArray(payload)) {
    return {
      page: requestedPage,
      pageSize: payload.length || requestedPageSize,
      total: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
      items: payload,
    };
  }

  const items = payload.items ?? payload.data ?? [];
  const total = payload.total ?? items.length;
  const pageSize = payload.pageSize ?? requestedPageSize;
  const page = payload.page ?? requestedPage;
  const totalPages =
    payload.totalPages ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 0);

  return {
    page,
    pageSize,
    total,
    totalPages,
    items,
  };
}

function normalizeNullableString(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSaveEmpleadoInput(input: SaveEmpleadoInput): SaveEmpleadoInput {
  return {
    nombres: input.nombres.trim(),
    apellidoPaterno: input.apellidoPaterno.trim(),
    apellidoMaterno: normalizeNullableString(input.apellidoMaterno),
    fechaNacimiento: normalizeNullableString(input.fechaNacimiento),
    telefono: normalizeNullableString(input.telefono),
    email: normalizeNullableString(input.email),
    fechaIngreso: input.fechaIngreso,
    activo: input.activo,
    departamentoId: input.departamentoId,
    puestoId: input.puestoId,
    sucursalId: input.sucursalId ?? null,
  };
}

function buildReporteParams(params: EmpleadosReporteParams) {
  const searchParams = new URLSearchParams();

  if (params.sucursalId != null) {
    searchParams.set("sucursalId", String(params.sucursalId));
  }

  if (params.departamentoId != null) {
    searchParams.set("departamentoId", String(params.departamentoId));
  }

  if (params.puestoId != null) {
    searchParams.set("puestoId", String(params.puestoId));
  }

  if (params.activo != null) {
    searchParams.set("activo", String(params.activo));
  }

  if (params.estatusLaboral) {
    searchParams.set("estatusLaboral", params.estatusLaboral);
  }

  if (params.fechaIngresoDesde) {
    searchParams.set("fechaIngresoDesde", params.fechaIngresoDesde);
  }

  if (params.fechaIngresoHasta) {
    searchParams.set("fechaIngresoHasta", params.fechaIngresoHasta);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  return searchParams;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getFileNameFromDisposition(
  disposition?: string | null,
  fallback = "reporte"
) {
  if (!disposition) return fallback;

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
}

export function getEmpleadoNombreCompleto(
  empleado: Pick<Empleado, "nombres" | "apellidoPaterno" | "apellidoMaterno">
): string {
  return [
    empleado.nombres,
    empleado.apellidoPaterno,
    empleado.apellidoMaterno ?? "",
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export async function getEmpleados(
  params?: GetEmpleadosParams
): Promise<Empleado[]> {
  const { data } = await api.get<EmpleadoListEnvelope>("/api/Empleados", {
    params,
  });

  return normalizeEmpleados(data);
}

export async function getEmpleadosPage(
  params?: GetEmpleadosParams
): Promise<EmpleadoListResponse> {
  const requestedPage = params?.page ?? 1;
  const requestedPageSize = params?.pageSize ?? 20;

  const { data } = await api.get<EmpleadoListEnvelope>("/api/Empleados", {
    params,
  });

  return normalizeEmpleadoListResponse(data, requestedPage, requestedPageSize);
}

export async function getEmpleadoById(id: number): Promise<Empleado> {
  const { data } = await api.get<Empleado>(`/api/Empleados/${id}`);
  return data;
}

export async function createEmpleado(
  input: SaveEmpleadoInput
): Promise<Empleado> {
  const payload = normalizeSaveEmpleadoInput(input);
  const { data } = await api.post<Empleado>("/api/Empleados", payload);
  return data;
}

export async function updateEmpleado(
  id: number,
  input: SaveEmpleadoInput
): Promise<Empleado> {
  const payload = normalizeSaveEmpleadoInput(input);
  const { data } = await api.put<Empleado>(`/api/Empleados/${id}`, payload);
  return data;
}

export async function darBajaEmpleado(
  id: number,
  payload: DarBajaEmpleadoInput
) {
  const { data } = await api.post(`/api/Empleados/${id}/baja`, payload);
  return data;
}

export async function reingresarEmpleado(
  id: number,
  payload: ReingresarEmpleadoInput
) {
  const { data } = await api.post(`/api/Empleados/${id}/reingreso`, payload);
  return data;
}

export async function getEmpleadoMovimientos(
  id: number
): Promise<EmpleadoMovimientoLaboral[]> {
  const { data } = await api.get<EmpleadoMovimientoLaboral[]>(
    `/api/Empleados/${id}/movimientos`
  );

  return Array.isArray(data) ? data : [];
}

export async function exportEmpleadosXlsx(params: EmpleadosReporteParams) {
  const query = buildReporteParams(params);

  const url = query.toString()
    ? `/api/Empleados/export/xlsx?${query.toString()}`
    : "/api/Empleados/export/xlsx";

  const response = await api.get(url, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "empleados.xlsx"
  );

  downloadBlob(response.data, fileName);
}

export async function exportEmpleadosPdf(params: EmpleadosReporteParams) {
  const query = buildReporteParams(params);

  const url = query.toString()
    ? `/api/Empleados/export/pdf?${query.toString()}`
    : "/api/Empleados/export/pdf";

  const response = await api.get(url, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "empleados.pdf"
  );

  downloadBlob(response.data, fileName);
}