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

type CumpleaniosFiltros = {
  sucursalId?: number | null;
  departamentoId?: number | null;
};

import { api } from "./axios";

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