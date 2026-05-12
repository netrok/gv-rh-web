import { api } from "./axios";

export type EstatusVacacionSolicitud =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA"
  | "CANCELADA";

export type VacacionesSolicitud = {
  id: number;

  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;

  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;

  vacacionPeriodoId?: number | null;
  vacacionMovimientoId?: number | null;
  incidenciaId?: number | null;

  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;

  estatus: EstatusVacacionSolicitud | string | number;
  estatusNombre: string;

  comentarioEmpleado?: string | null;
  comentarioResolucion?: string | null;
  motivoRechazo?: string | null;

  solicitadaPorUsuarioId?: number | null;
  solicitadaPorUsuario?: string | null;

  resueltaPorUsuarioId?: number | null;
  resueltaPorUsuario?: string | null;

  aprobadorEmpleadoId?: number | null;
  aprobadorEmpleado?: string | null;

  fechaResolucionUtc?: string | null;

  createdAtUtc: string;
  updatedAtUtc: string;
};

export type VacacionesSolicitudQuery = {
  empleadoId?: number | "";
  sucursalId?: number | "";
  departamentoId?: number | "";
  puestoId?: number | "";
  estatus?: EstatusVacacionSolicitud | "";
  fechaDesde?: string;
  fechaHasta?: string;
  soloPendientes?: boolean;
  page?: number;
  pageSize?: number;
};

export type VacacionesSolicitudListResult = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  canceladas: number;

  items: VacacionesSolicitud[];
};

export type VacacionesSolicitudCreate = {
  empleadoId?: number | null;
  vacacionPeriodoId?: number | null;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  comentarioEmpleado?: string | null;
};

export type VacacionesSolicitudResolver = {
  comentarioResolucion?: string | null;
  motivoRechazo?: string | null;
};

export type VacacionesEmpleadoLookup = {
  id: number;
  numEmpleado: string;
  nombreCompleto: string;
  sucursalNombre?: string | null;
  departamentoNombre?: string | null;
  puestoNombre?: string | null;
};

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapItems(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.Items)) return value.Items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.Data)) return value.Data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.Results)) return value.Results;
  return [];
}

function normalizeSolicitud(item: any): VacacionesSolicitud {
  return {
    id: asNumber(item?.id ?? item?.Id),

    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: String(item?.numEmpleado ?? item?.NumEmpleado ?? ""),
    nombreEmpleado: String(item?.nombreEmpleado ?? item?.NombreEmpleado ?? ""),

    sucursal: item?.sucursal ?? item?.Sucursal ?? null,
    departamento: item?.departamento ?? item?.Departamento ?? null,
    puesto: item?.puesto ?? item?.Puesto ?? null,

    vacacionPeriodoId: item?.vacacionPeriodoId ?? item?.VacacionPeriodoId ?? null,
    vacacionMovimientoId: item?.vacacionMovimientoId ?? item?.VacacionMovimientoId ?? null,
    incidenciaId: item?.incidenciaId ?? item?.IncidenciaId ?? null,

    fechaInicio: String(item?.fechaInicio ?? item?.FechaInicio ?? ""),
    fechaFin: String(item?.fechaFin ?? item?.FechaFin ?? ""),
    diasSolicitados: asNumber(item?.diasSolicitados ?? item?.DiasSolicitados),

    estatus: item?.estatus ?? item?.Estatus ?? "",
    estatusNombre: String(item?.estatusNombre ?? item?.EstatusNombre ?? item?.estatus ?? item?.Estatus ?? ""),

    comentarioEmpleado: item?.comentarioEmpleado ?? item?.ComentarioEmpleado ?? null,
    comentarioResolucion: item?.comentarioResolucion ?? item?.ComentarioResolucion ?? null,
    motivoRechazo: item?.motivoRechazo ?? item?.MotivoRechazo ?? null,

    solicitadaPorUsuarioId: item?.solicitadaPorUsuarioId ?? item?.SolicitadaPorUsuarioId ?? null,
    solicitadaPorUsuario: item?.solicitadaPorUsuario ?? item?.SolicitadaPorUsuario ?? null,

    resueltaPorUsuarioId: item?.resueltaPorUsuarioId ?? item?.ResueltaPorUsuarioId ?? null,
    resueltaPorUsuario: item?.resueltaPorUsuario ?? item?.ResueltaPorUsuario ?? null,

    aprobadorEmpleadoId: item?.aprobadorEmpleadoId ?? item?.AprobadorEmpleadoId ?? null,
    aprobadorEmpleado: item?.aprobadorEmpleado ?? item?.AprobadorEmpleado ?? null,

    fechaResolucionUtc: item?.fechaResolucionUtc ?? item?.FechaResolucionUtc ?? null,

    createdAtUtc: String(item?.createdAtUtc ?? item?.CreatedAtUtc ?? ""),
    updatedAtUtc: String(item?.updatedAtUtc ?? item?.UpdatedAtUtc ?? ""),
  };
}

function buildParams(query: VacacionesSolicitudQuery = {}) {
  const params: Record<string, unknown> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    params[key] = value;
  });

  return params;
}

export async function getVacacionesSolicitudes(
  query: VacacionesSolicitudQuery = {}
): Promise<VacacionesSolicitudListResult> {
  const { data } = await api.get("/api/Vacaciones/solicitudes", {
    params: buildParams(query),
  });

  const items = unwrapItems(data).map(normalizeSolicitud);

  return {
    page: asNumber(data?.page ?? data?.Page ?? query.page ?? 1),
    pageSize: asNumber(data?.pageSize ?? data?.PageSize ?? query.pageSize ?? 50),
    total: asNumber(data?.total ?? data?.Total ?? items.length),
    totalPages: asNumber(data?.totalPages ?? data?.TotalPages ?? 1),

    pendientes: asNumber(data?.pendientes ?? data?.Pendientes),
    aprobadas: asNumber(data?.aprobadas ?? data?.Aprobadas),
    rechazadas: asNumber(data?.rechazadas ?? data?.Rechazadas),
    canceladas: asNumber(data?.canceladas ?? data?.Canceladas),

    items,
  };
}

export async function createVacacionesSolicitud(
  payload: VacacionesSolicitudCreate
): Promise<VacacionesSolicitud> {
  const { data } = await api.post("/api/Vacaciones/solicitudes", payload);
  return normalizeSolicitud(data);
}

export async function aprobarVacacionesSolicitud(
  id: number,
  payload: VacacionesSolicitudResolver
): Promise<VacacionesSolicitud> {
  const { data } = await api.post(`/api/Vacaciones/solicitudes/${id}/aprobar`, payload);
  return normalizeSolicitud(data);
}

export async function rechazarVacacionesSolicitud(
  id: number,
  payload: VacacionesSolicitudResolver
): Promise<VacacionesSolicitud> {
  const { data } = await api.post(`/api/Vacaciones/solicitudes/${id}/rechazar`, payload);
  return normalizeSolicitud(data);
}

export async function cancelarVacacionesSolicitud(
  id: number,
  payload: VacacionesSolicitudResolver
): Promise<VacacionesSolicitud> {
  const { data } = await api.post(`/api/Vacaciones/solicitudes/${id}/cancelar`, payload);
  return normalizeSolicitud(data);
}

export async function getVacacionesEmpleadoLookup(): Promise<VacacionesEmpleadoLookup[]> {
  const { data } = await api.get("/api/Empleados", {
    params: {
      page: 1,
      pageSize: 500,
      activo: true,
    },
  });

  return unwrapItems(data).map((item: any) => {
    const nombreCompleto =
      item?.nombreCompleto ??
      item?.NombreCompleto ??
      [item?.nombres ?? item?.Nombres, item?.apellidoPaterno ?? item?.ApellidoPaterno, item?.apellidoMaterno ?? item?.ApellidoMaterno]
        .filter(Boolean)
        .join(" ");

    return {
      id: asNumber(item?.id ?? item?.Id),
      numEmpleado: String(item?.numEmpleado ?? item?.NumEmpleado ?? ""),
      nombreCompleto: String(nombreCompleto ?? ""),
      sucursalNombre: item?.sucursalNombre ?? item?.SucursalNombre ?? item?.sucursal?.nombre ?? item?.Sucursal?.Nombre ?? null,
      departamentoNombre:
        item?.departamentoNombre ?? item?.DepartamentoNombre ?? item?.departamento?.nombre ?? item?.Departamento?.Nombre ?? null,
      puestoNombre: item?.puestoNombre ?? item?.PuestoNombre ?? item?.puesto?.nombre ?? item?.Puesto?.Nombre ?? null,
    };
  });
}

export function getEstatusVacacionSolicitudLabel(value?: string | number | null): string {
  const raw = String(value ?? "").toUpperCase();

  if (raw === "1" || raw === "PENDIENTE") return "Pendiente";
  if (raw === "2" || raw === "APROBADA") return "Aprobada";
  if (raw === "3" || raw === "RECHAZADA") return "Rechazada";
  if (raw === "4" || raw === "CANCELADA") return "Cancelada";

  return raw || "—";
}

export async function getMisVacacionesSolicitudes(
  query: VacacionesSolicitudQuery = {}
): Promise<VacacionesSolicitudListResult> {
  const { data } = await api.get("/api/me/vacaciones/solicitudes", {
    params: buildParams(query),
  });

  const items = unwrapItems(data).map(normalizeSolicitud);

  return {
    page: asNumber(data?.page ?? data?.Page ?? query.page ?? 1),
    pageSize: asNumber(data?.pageSize ?? data?.PageSize ?? query.pageSize ?? 50),
    total: asNumber(data?.total ?? data?.Total),
    totalPages: asNumber(data?.totalPages ?? data?.TotalPages ?? 1),

    pendientes: asNumber(data?.pendientes ?? data?.Pendientes),
    aprobadas: asNumber(data?.aprobadas ?? data?.Aprobadas),
    rechazadas: asNumber(data?.rechazadas ?? data?.Rechazadas),
    canceladas: asNumber(data?.canceladas ?? data?.Canceladas),

    items,
  };
}

