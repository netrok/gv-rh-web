import { api } from "./axios";
import { getAudit, type AuditItem } from "./audit.api";

export type DashboardStats = {
  empleadosTotal: number;
  departamentosTotal: number;
  puestosTotal: number;
  sucursalesTotal: number;
  usuariosTotal: number;
  vacantesTotal: number;
  candidatosTotal: number;
  auditoriaTotal: number;
  recentAudit: AuditItem[];
};

export type DashboardCountBy = {
  nombre: string;
  total: number;
};

export type DashboardIncidenciaReciente = {
  id: number;
  empleadoId: number;
  numEmpleado: string;
  empleadoNombre: string;
  tipo: string;
  estatus: string;
  fechaInicio: string;
  fechaFin?: string | null;
  createdAtUtc: string;
};

export type DashboardData = {
  empleadosActivos: number;
  sucursalesActivas: number;
  incidenciasPendientes: number;
  incidenciasMes: number;
  incidenciasPorTipo: DashboardCountBy[];
  incidenciasPorEstatus: DashboardCountBy[];
  incidenciasRecientes: DashboardIncidenciaReciente[];
};

export type DashboardDocumentoAlertaItem = {
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;
  departamentoNombre?: string | null;
  puestoNombre?: string | null;
  sucursalNombre?: string | null;
  totalFaltantes: number;
  totalPorVencer: number;
  totalVencidos: number;
  porcentajeCumplimiento: number;
};

export type DashboardDocumentosResumen = {
  totalEmpleadosActivos: number;
  expedientesIncompletos: number;
  documentosPorVencer: number;
  documentosVencidos: number;
  alertas: DashboardDocumentoAlertaItem[];
};

export type DashboardOverview = {
  stats: DashboardStats;
  dashboard: DashboardData;
  documentos: DashboardDocumentosResumen;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function unwrapCollection<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.items,
    payload.Items,
    payload.data,
    payload.Data,
    payload.results,
    payload.Results,
    payload.value,
    payload.Value,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function extractTotal(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (!isRecord(payload)) {
    return 0;
  }

  const directCandidates = [
    payload.total,
    payload.Total,
    payload.totalCount,
    payload.TotalCount,
    payload.count,
    payload.Count,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "number") {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim() !== "") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  const collection = unwrapCollection(payload);
  if (collection.length > 0) {
    return collection.length;
  }

  return 0;
}

async function safeGet<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  try {
    const { data } = await api.get<T>(url, { params });
    return data;
  } catch {
    return null;
  }
}

async function fetchCollectionTotal(url: string): Promise<number> {
  const data = await safeGet<unknown>(url, {
    page: 1,
    pageSize: 1,
  });

  return extractTotal(data);
}

function normalizeDashboardData(payload: DashboardData | null): DashboardData {
  return {
    empleadosActivos: asNumber(payload?.empleadosActivos),
    sucursalesActivas: asNumber(payload?.sucursalesActivas),
    incidenciasPendientes: asNumber(payload?.incidenciasPendientes),
    incidenciasMes: asNumber(payload?.incidenciasMes),
    incidenciasPorTipo: Array.isArray(payload?.incidenciasPorTipo)
      ? payload.incidenciasPorTipo
      : [],
    incidenciasPorEstatus: Array.isArray(payload?.incidenciasPorEstatus)
      ? payload.incidenciasPorEstatus
      : [],
    incidenciasRecientes: Array.isArray(payload?.incidenciasRecientes)
      ? payload.incidenciasRecientes
      : [],
  };
}

function normalizeDashboardDocumentosResumen(
  payload: DashboardDocumentosResumen | null
): DashboardDocumentosResumen {
  return {
    totalEmpleadosActivos: asNumber(payload?.totalEmpleadosActivos),
    expedientesIncompletos: asNumber(payload?.expedientesIncompletos),
    documentosPorVencer: asNumber(payload?.documentosPorVencer),
    documentosVencidos: asNumber(payload?.documentosVencidos),
    alertas: Array.isArray(payload?.alertas) ? payload.alertas : [],
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    empleadosTotal,
    departamentosTotal,
    puestosTotal,
    sucursalesTotal,
    usuariosTotal,
    vacantesTotal,
    candidatosTotal,
    auditPage,
  ] = await Promise.all([
    fetchCollectionTotal("/api/Empleados"),
    fetchCollectionTotal("/api/Departamentos"),
    fetchCollectionTotal("/api/Puestos"),
    fetchCollectionTotal("/api/Sucursales"),
    fetchCollectionTotal("/api/Usuarios"),
    fetchCollectionTotal("/api/Vacantes"),
    fetchCollectionTotal("/api/Candidatos"),
    getAudit({ page: 1, pageSize: 5 }).catch(() => ({
      total: 0,
      items: [],
    })),
  ]);

  return {
    empleadosTotal,
    departamentosTotal,
    puestosTotal,
    sucursalesTotal,
    usuariosTotal,
    vacantesTotal,
    candidatosTotal,
    auditoriaTotal: auditPage.total ?? 0,
    recentAudit: auditPage.items ?? [],
  };
}

export async function getDashboard(): Promise<DashboardData> {
  const data = await safeGet<DashboardData>("/api/Dashboard");
  return normalizeDashboardData(data);
}

/**
 * Alias correcto para el frontend nuevo.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return getDashboard();
}

/**
 * Alias temporal por si quedó el typo en algún import viejo.
 * Luego lo puedes borrar cuando limpies todo.
 */
export async function getDashoardData(): Promise<DashboardData> {
  return getDashboard();
}

export async function getDashboardDocumentosResumen(): Promise<DashboardDocumentosResumen> {
  const data = await safeGet<DashboardDocumentosResumen>(
    "/api/Dashboard/documentos"
  );
  return normalizeDashboardDocumentosResumen(data);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [stats, dashboard, documentos] = await Promise.all([
    getDashboardStats(),
    getDashboard(),
    getDashboardDocumentosResumen(),
  ]);

  return {
    stats,
    dashboard,
    documentos,
  };
}