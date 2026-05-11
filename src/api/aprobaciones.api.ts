import api from "./axios";

export type MisAprobacionesTipo = "INCIDENCIA" | "VACACIONES" | string;

export interface MisAprobacionesItem {
  tipo: MisAprobacionesTipo;
  id: number;
  empleadoId: number;
  numEmpleado: string;
  empleadoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  estatus: string;
  descripcion: string;
  urlDetalle: string;
  createdAtUtc: string;
}

export interface MisAprobacionesDto {
  totalPendientes: number;
  incidenciasPendientes: number;
  vacacionesPendientes: number;
  items: MisAprobacionesItem[];
}

export async function getMisAprobaciones(): Promise<MisAprobacionesDto> {
  const { data } = await api.get<MisAprobacionesDto>("/api/me/aprobaciones");
  return data;
}
