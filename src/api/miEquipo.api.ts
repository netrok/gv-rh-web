import { api } from "./axios";

export type MiEquipoEmpleado = {
  id: number;
  numEmpleado: string;
  nombreCompleto: string;
  email?: string | null;
  telefono?: string | null;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  departamentoId?: number | null;
  departamentoNombre?: string | null;
  puestoId?: number | null;
  puestoNombre?: string | null;
  tipoRelacion: string;
  activo: boolean;
  estatusLaboral: string;
};

export type MiEquipo = {
  jefeEmpleadoId: number;
  jefeNombre: string;
  total: number;
  comoAprobadorPrimario: number;
  comoAprobadorSecundario: number;
  empleados: MiEquipoEmpleado[];
};

export async function getMiEquipo(): Promise<MiEquipo> {
  const { data } = await api.get<MiEquipo>("/api/me/equipo");

  return {
    jefeEmpleadoId: Number(data?.jefeEmpleadoId ?? 0),
    jefeNombre: data?.jefeNombre ?? "",
    total: Number(data?.total ?? 0),
    comoAprobadorPrimario: Number(data?.comoAprobadorPrimario ?? 0),
    comoAprobadorSecundario: Number(data?.comoAprobadorSecundario ?? 0),
    empleados: Array.isArray(data?.empleados) ? data.empleados : [],
  };
}

export function getTipoRelacionLabel(value?: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "APROBADOR_PRIMARIO":
      return "Aprobador primario";
    case "APROBADOR_SECUNDARIO":
      return "Aprobador secundario";
    default:
      return value || "Relación no definida";
  }
}