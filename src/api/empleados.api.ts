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