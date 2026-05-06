import { api } from "./axios";

export type TipoMovimientoVacacion =
  | "SALDO_INICIAL"
  | "APERTURA"
  | "DISFRUTE"
  | "PAGO_DIAS"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "CANCELACION"
  | "VENCIMIENTO"
  | "PAGO_PRIMA";

export type EstatusVacacionPeriodo = "ABIERTO" | "CERRADO" | "VENCIDO";

export type VacacionPeriodo = {
  id: number;
  empleadoId: number;
  vacacionPoliticaId?: number | null;
  vacacionPoliticaNombre?: string | null;
  cicloLaboral: number;
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
  primaPagada: boolean;
  fechaPagoPrima?: string | null;
  comentario?: string | null;
  estatus: EstatusVacacionPeriodo;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type VacacionesResumen = {
  empleadoId: number;
  numEmpleado: string;
  empleadoNombre: string;
  fechaIngresoOriginal: string;
  fechaIngreso: string;
  cicloLaboralActual: number;
  fechaBaseCicloLaboral: string;
  antiguedadAnios: number;
  proximoAniversario?: string | null;
  politicaId?: number | null;
  politicaNombre?: string | null;
  primaVacacionalPorcentaje: number;
  diasDerechoTotal: number;
  diasTomadosTotal: number;
  diasPagadosTotal: number;
  diasAjustadosTotal: number;
  diasVencidosTotal: number;
  saldoDisponible: number;
  periodosTotales: number;
  periodosAbiertos: number;
  periodoActual?: VacacionPeriodo | null;
};

export type VacacionMovimiento = {
  id: number;
  empleadoId: number;
  vacacionPeriodoId: number;
  cicloLaboral: number;
  anioServicio: number;
  tipoMovimiento: TipoMovimientoVacacion;
  fechaMovimiento: string;
  fechaInicioDisfrute?: string | null;
  fechaFinDisfrute?: string | null;
  dias: number;
  saldoAntes: number;
  saldoDespues: number;
  referencia?: string | null;
  comentario?: string | null;
  usuarioResponsableId?: number | null;
  origen?: string | null;
  importacionArchivo?: string | null;
  importacionHoja?: string | null;
  importacionFila?: number | null;
  createdAtUtc: string;
};

export type GenerarPeriodoVacacionRequest = {
  anioServicio?: number | null;
  comentario?: string | null;
};

export type RegistrarDisfruteVacacionRequest = {
  vacacionPeriodoId: number;
  fechaInicioDisfrute: string;
  fechaFinDisfrute: string;
  dias: number;
  referencia?: string | null;
  comentario?: string | null;
};

export type RegistrarAjusteVacacionRequest = {
  vacacionPeriodoId: number;
  dias: number;
  fechaMovimiento?: string | null;
  referencia?: string | null;
  comentario?: string | null;
};

export async function getVacacionesResumen(empleadoId: number): Promise<VacacionesResumen> {
  const { data } = await api.get<VacacionesResumen>(`/api/Vacaciones/empleado/${empleadoId}/resumen`);
  return data;
}

export async function getVacacionesPeriodos(empleadoId: number): Promise<VacacionPeriodo[]> {
  const { data } = await api.get<VacacionPeriodo[]>(`/api/Vacaciones/empleado/${empleadoId}/periodos`);
  return data;
}

export async function getVacacionesKardex(empleadoId: number): Promise<VacacionMovimiento[]> {
  const { data } = await api.get<VacacionMovimiento[]>(`/api/Vacaciones/empleado/${empleadoId}/kardex`);
  return data;
}

export async function generarPeriodoVacacion(
  empleadoId: number,
  payload: GenerarPeriodoVacacionRequest
): Promise<VacacionPeriodo> {
  const { data } = await api.post<VacacionPeriodo>(
    `/api/Vacaciones/empleado/${empleadoId}/generar-periodo`,
    payload
  );
  return data;
}

export async function registrarDisfruteVacacion(
  empleadoId: number,
  payload: RegistrarDisfruteVacacionRequest
): Promise<VacacionMovimiento> {
  const { data } = await api.post<VacacionMovimiento>(
    `/api/Vacaciones/empleado/${empleadoId}/registrar-disfrute`,
    payload
  );
  return data;
}

export async function registrarAjusteVacacion(
  empleadoId: number,
  payload: RegistrarAjusteVacacionRequest
): Promise<VacacionMovimiento> {
  const { data } = await api.post<VacacionMovimiento>(
    `/api/Vacaciones/empleado/${empleadoId}/ajuste`,
    payload
  );
  return data;
}

export async function getMisVacacionesResumen(): Promise<VacacionesResumen> {
  const { data } = await api.get<VacacionesResumen>("/api/me/vacaciones/resumen");
  return data;
}

export async function getMisVacacionesPeriodos(): Promise<VacacionPeriodo[]> {
  const { data } = await api.get<VacacionPeriodo[]>("/api/me/vacaciones/periodos");
  return data;
}

export async function getMisVacacionesKardex(): Promise<VacacionMovimiento[]> {
  const { data } = await api.get<VacacionMovimiento[]>("/api/me/vacaciones/kardex");
  return data;
}

export function getTipoMovimientoVacacionLabel(tipo: TipoMovimientoVacacion | string): string {
  switch (tipo) {
    case "SALDO_INICIAL": return "Saldo inicial";
    case "APERTURA": return "Apertura";
    case "DISFRUTE": return "Disfrute";
    case "PAGO_DIAS": return "Pago de días";
    case "AJUSTE_POSITIVO": return "Ajuste positivo";
    case "AJUSTE_NEGATIVO": return "Ajuste negativo";
    case "CANCELACION": return "Cancelación";
    case "VENCIMIENTO": return "Vencimiento";
    case "PAGO_PRIMA": return "Pago de prima";
    default: return String(tipo);
  }
}

export function getEstatusVacacionPeriodoLabel(estatus: EstatusVacacionPeriodo | string): string {
  switch (estatus) {
    case "ABIERTO": return "Abierto";
    case "CERRADO": return "Cerrado";
    case "VENCIDO": return "Vencido";
    default: return String(estatus);
  }
}

export function getEstatusVacacionPeriodoColor(
  estatus: EstatusVacacionPeriodo | string
): "success" | "warning" | "error" | "default" {
  switch (estatus) {
    case "ABIERTO": return "success";
    case "CERRADO": return "default";
    case "VENCIDO": return "error";
    default: return "default";
  }
}

export function getTipoMovimientoVacacionColor(
  tipo: TipoMovimientoVacacion | string
): "success" | "warning" | "error" | "info" | "default" {
  switch (tipo) {
    case "APERTURA":
    case "SALDO_INICIAL":
    case "AJUSTE_POSITIVO":
    case "CANCELACION":
      return "success";
    case "DISFRUTE":
    case "PAGO_DIAS":
    case "AJUSTE_NEGATIVO":
    case "VENCIMIENTO":
      return "warning";
    case "PAGO_PRIMA": return "info";
    default: return "default";
  }
}



