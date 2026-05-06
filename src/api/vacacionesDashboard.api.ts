import { api } from "./axios";

export type VacacionesDashboardSaldoAlto = {
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;
  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;
  cicloLaboral: number;
  periodosAbiertos: number;
  saldo: number;
};

export type VacacionesDashboardPeriodoVencer = {
  vacacionPeriodoId: number;
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;
  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;
  cicloLaboral: number;
  anioServicio: number;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteDisfrute: string;
  diasParaVencer: number;
  saldo: number;
};

export type VacacionesDashboardMovimiento = {
  movimientoId: number;
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;
  vacacionPeriodoId: number;
  cicloLaboral: number;
  tipoMovimiento: string;
  fechaMovimiento: string;
  dias: number;
  saldoAntes: number;
  saldoDespues: number;
  referencia?: string | null;
  origen?: string | null;
  comentario?: string | null;
  createdAtUtc: string;
};

export type VacacionesDashboardAniversario = {
  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;
  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;
  fechaBaseCicloLaboral: string;
  proximoAniversario: string;
  diasRestantes: number;
  aniosServicioCumplidos: number;
};

export type VacacionesDashboard = {
  fechaCorte: string;

  empleadosActivos: number;
  empleadosConSaldo: number;
  empleadosSinPeriodoAbierto: number;

  periodosAbiertos: number;
  periodosVencidos: number;
  periodosPorVencer30Dias: number;

  saldoTotal: number;
  diasDerechoTotal: number;
  diasTomadosTotal: number;
  diasVencidosTotal: number;

  movimientosMes: number;
  movimientosImportacionLegacy: number;

  topSaldos: VacacionesDashboardSaldoAlto[];
  periodosPorVencer: VacacionesDashboardPeriodoVencer[];
  ultimosMovimientos: VacacionesDashboardMovimiento[];
  proximosAniversarios: VacacionesDashboardAniversario[];
};

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeDashboard(payload: Partial<VacacionesDashboard> | null | undefined): VacacionesDashboard {
  return {
    fechaCorte: payload?.fechaCorte ?? "",

    empleadosActivos: asNumber(payload?.empleadosActivos),
    empleadosConSaldo: asNumber(payload?.empleadosConSaldo),
    empleadosSinPeriodoAbierto: asNumber(payload?.empleadosSinPeriodoAbierto),

    periodosAbiertos: asNumber(payload?.periodosAbiertos),
    periodosVencidos: asNumber(payload?.periodosVencidos),
    periodosPorVencer30Dias: asNumber(payload?.periodosPorVencer30Dias),

    saldoTotal: asNumber(payload?.saldoTotal),
    diasDerechoTotal: asNumber(payload?.diasDerechoTotal),
    diasTomadosTotal: asNumber(payload?.diasTomadosTotal),
    diasVencidosTotal: asNumber(payload?.diasVencidosTotal),

    movimientosMes: asNumber(payload?.movimientosMes),
    movimientosImportacionLegacy: asNumber(payload?.movimientosImportacionLegacy),

    topSaldos: asArray(payload?.topSaldos),
    periodosPorVencer: asArray(payload?.periodosPorVencer),
    ultimosMovimientos: asArray(payload?.ultimosMovimientos),
    proximosAniversarios: asArray(payload?.proximosAniversarios),
  };
}

export async function getVacacionesDashboard(): Promise<VacacionesDashboard> {
  const { data } = await api.get<VacacionesDashboard>("/api/Vacaciones/dashboard");
  return normalizeDashboard(data);
}
