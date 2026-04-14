import { api } from "./axios";

export type DashboardCountItem = {
  nombre: string;
  total: number;
};

export type DashboardVacanteResumen = {
  id: number;
  titulo: string;
  departamento?: string | null;
  sucursal?: string | null;
  estatus: string;
  totalCandidatos: number;
};

export type DashboardCandidatoResumen = {
  id: number;
  nombreCompleto: string;
  vacante?: string | null;
  etapa: string;
  fechaRegistroUtc: string;
};

export type DashboardAlerta = {
  tipo: string;
  titulo: string;
  descripcion?: string | null;
  total?: number | null;
};

export type ReclutamientoDashboardData = {
  vacantesActivas: number;
  vacantesCerradas: number;
  candidatosTotales: number;
  candidatosEnProceso: number;
  contratadosMes: number;
  pipelinePorEtapa: DashboardCountItem[];
  vacantesTop: DashboardVacanteResumen[];
  candidatosRecientes: DashboardCandidatoResumen[];
  alertas: DashboardAlerta[];
};

export async function getReclutamientoDashboard() {
  const { data } = await api.get<ReclutamientoDashboardData>(
    "/api/Reclutamiento/dashboard"
  );
  return data;
}