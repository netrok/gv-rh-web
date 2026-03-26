import { api } from "./axios";
import { getAudit, type AuditItem } from "./audit.api";

export type DashboardStats = {
  empleadosTotal: number;
  departamentosTotal: number;
  puestosTotal: number;
  sucursalesTotal: number;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTotal(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (!isRecord(payload)) {
    return 0;
  }

  const total = payload.total;
  if (typeof total === "number") {
    return total;
  }

  const totalCount = payload.totalCount;
  if (typeof totalCount === "number") {
    return totalCount;
  }

  const count = payload.count;
  if (typeof count === "number") {
    return count;
  }

  const items = payload.items;
  if (Array.isArray(items)) {
    return items.length;
  }

  const data = payload.data;
  if (Array.isArray(data)) {
    return data.length;
  }

  return 0;
}

async function fetchCollectionTotal(url: string): Promise<number> {
  const { data } = await api.get(url, {
    params: {
      page: 1,
      pageSize: 1,
    },
  });

  return extractTotal(data);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    empleadosTotal,
    departamentosTotal,
    puestosTotal,
    sucursalesTotal,
    auditPage,
  ] = await Promise.all([
    fetchCollectionTotal("/api/Empleados"),
    fetchCollectionTotal("/api/Departamentos"),
    fetchCollectionTotal("/api/Puestos"),
    fetchCollectionTotal("/api/Sucursales"),
    getAudit({ page: 1, pageSize: 5 }),
  ]);

  return {
    empleadosTotal,
    departamentosTotal,
    puestosTotal,
    sucursalesTotal,
    auditoriaTotal: auditPage.total ?? 0,
    recentAudit: auditPage.items ?? [],
  };
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>("/api/Dashboard");
  return data;
}

export async function getDashboardDocumentosResumen(): Promise<DashboardDocumentosResumen> {
  const { data } = await api.get<DashboardDocumentosResumen>(
    "/api/Dashboard/documentos"
  );

  return data;
}