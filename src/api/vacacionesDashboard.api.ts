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

export type VacacionesDashboardSolicitud = {
  solicitudId: number;

  empleadoId: number;
  numEmpleado: string;
  nombreEmpleado: string;

  sucursal?: string | null;
  departamento?: string | null;
  puesto?: string | null;

  fechaInicio: string;
  fechaFin: string;

  diasSolicitados: number;

  estatus: string;
  estatusNombre: string;

  comentarioEmpleado?: string | null;

  aprobadorEmpleadoId?: number | null;
  aprobadorEmpleado?: string | null;

  fechaResolucionUtc?: string | null;

  diasParaInicio: number;

  createdAtUtc: string;
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

  solicitudesPendientes: number;
  solicitudesAprobadasMes: number;
  solicitudesRechazadasMes: number;
  solicitudesCanceladasMes: number;

  diasSolicitadosPendientes: number;
  diasAprobadosMes: number;

  topSaldos: VacacionesDashboardSaldoAlto[];
  periodosPorVencer: VacacionesDashboardPeriodoVencer[];
  ultimosMovimientos: VacacionesDashboardMovimiento[];
  proximosAniversarios: VacacionesDashboardAniversario[];

  solicitudesPendientesDetalle: VacacionesDashboardSolicitud[];
  proximasVacacionesAprobadas: VacacionesDashboardSolicitud[];
};

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value);
  return text.trim() ? text : null;
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSaldoAlto(item: any): VacacionesDashboardSaldoAlto {
  return {
    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: asString(item?.numEmpleado ?? item?.NumEmpleado),
    nombreEmpleado: asString(item?.nombreEmpleado ?? item?.NombreEmpleado),
    sucursal: asNullableString(item?.sucursal ?? item?.Sucursal),
    departamento: asNullableString(item?.departamento ?? item?.Departamento),
    puesto: asNullableString(item?.puesto ?? item?.Puesto),
    cicloLaboral: asNumber(item?.cicloLaboral ?? item?.CicloLaboral),
    periodosAbiertos: asNumber(item?.periodosAbiertos ?? item?.PeriodosAbiertos),
    saldo: asNumber(item?.saldo ?? item?.Saldo),
  };
}

function normalizePeriodoVencer(item: any): VacacionesDashboardPeriodoVencer {
  return {
    vacacionPeriodoId: asNumber(item?.vacacionPeriodoId ?? item?.VacacionPeriodoId),
    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: asString(item?.numEmpleado ?? item?.NumEmpleado),
    nombreEmpleado: asString(item?.nombreEmpleado ?? item?.NombreEmpleado),
    sucursal: asNullableString(item?.sucursal ?? item?.Sucursal),
    departamento: asNullableString(item?.departamento ?? item?.Departamento),
    puesto: asNullableString(item?.puesto ?? item?.Puesto),
    cicloLaboral: asNumber(item?.cicloLaboral ?? item?.CicloLaboral),
    anioServicio: asNumber(item?.anioServicio ?? item?.AnioServicio),
    fechaInicio: asString(item?.fechaInicio ?? item?.FechaInicio),
    fechaFin: asString(item?.fechaFin ?? item?.FechaFin),
    fechaLimiteDisfrute: asString(
      item?.fechaLimiteDisfrute ?? item?.FechaLimiteDisfrute
    ),
    diasParaVencer: asNumber(item?.diasParaVencer ?? item?.DiasParaVencer),
    saldo: asNumber(item?.saldo ?? item?.Saldo),
  };
}

function normalizeMovimiento(item: any): VacacionesDashboardMovimiento {
  return {
    movimientoId: asNumber(item?.movimientoId ?? item?.MovimientoId),
    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: asString(item?.numEmpleado ?? item?.NumEmpleado),
    nombreEmpleado: asString(item?.nombreEmpleado ?? item?.NombreEmpleado),
    vacacionPeriodoId: asNumber(item?.vacacionPeriodoId ?? item?.VacacionPeriodoId),
    cicloLaboral: asNumber(item?.cicloLaboral ?? item?.CicloLaboral),
    tipoMovimiento: asString(item?.tipoMovimiento ?? item?.TipoMovimiento),
    fechaMovimiento: asString(item?.fechaMovimiento ?? item?.FechaMovimiento),
    dias: asNumber(item?.dias ?? item?.Dias),
    saldoAntes: asNumber(item?.saldoAntes ?? item?.SaldoAntes),
    saldoDespues: asNumber(item?.saldoDespues ?? item?.SaldoDespues),
    referencia: asNullableString(item?.referencia ?? item?.Referencia),
    origen: asNullableString(item?.origen ?? item?.Origen),
    comentario: asNullableString(item?.comentario ?? item?.Comentario),
    createdAtUtc: asString(item?.createdAtUtc ?? item?.CreatedAtUtc),
  };
}

function normalizeAniversario(item: any): VacacionesDashboardAniversario {
  return {
    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: asString(item?.numEmpleado ?? item?.NumEmpleado),
    nombreEmpleado: asString(item?.nombreEmpleado ?? item?.NombreEmpleado),
    sucursal: asNullableString(item?.sucursal ?? item?.Sucursal),
    departamento: asNullableString(item?.departamento ?? item?.Departamento),
    puesto: asNullableString(item?.puesto ?? item?.Puesto),
    fechaBaseCicloLaboral: asString(
      item?.fechaBaseCicloLaboral ?? item?.FechaBaseCicloLaboral
    ),
    proximoAniversario: asString(item?.proximoAniversario ?? item?.ProximoAniversario),
    diasRestantes: asNumber(item?.diasRestantes ?? item?.DiasRestantes),
    aniosServicioCumplidos: asNumber(
      item?.aniosServicioCumplidos ?? item?.AniosServicioCumplidos
    ),
  };
}

function normalizeSolicitud(item: any): VacacionesDashboardSolicitud {
  return {
    solicitudId: asNumber(item?.solicitudId ?? item?.SolicitudId),

    empleadoId: asNumber(item?.empleadoId ?? item?.EmpleadoId),
    numEmpleado: asString(item?.numEmpleado ?? item?.NumEmpleado),
    nombreEmpleado: asString(item?.nombreEmpleado ?? item?.NombreEmpleado),

    sucursal: asNullableString(item?.sucursal ?? item?.Sucursal),
    departamento: asNullableString(item?.departamento ?? item?.Departamento),
    puesto: asNullableString(item?.puesto ?? item?.Puesto),

    fechaInicio: asString(item?.fechaInicio ?? item?.FechaInicio),
    fechaFin: asString(item?.fechaFin ?? item?.FechaFin),

    diasSolicitados: asNumber(item?.diasSolicitados ?? item?.DiasSolicitados),

    estatus: asString(item?.estatus ?? item?.Estatus),
    estatusNombre: asString(item?.estatusNombre ?? item?.EstatusNombre),

    comentarioEmpleado: asNullableString(
      item?.comentarioEmpleado ?? item?.ComentarioEmpleado
    ),

    aprobadorEmpleadoId:
      item?.aprobadorEmpleadoId ?? item?.AprobadorEmpleadoId ?? null,
    aprobadorEmpleado: asNullableString(
      item?.aprobadorEmpleado ?? item?.AprobadorEmpleado
    ),

    fechaResolucionUtc:
      item?.fechaResolucionUtc ?? item?.FechaResolucionUtc ?? null,

    diasParaInicio: asNumber(item?.diasParaInicio ?? item?.DiasParaInicio),

    createdAtUtc: asString(item?.createdAtUtc ?? item?.CreatedAtUtc),
  };
}

function normalizeDashboard(
  payload: Partial<VacacionesDashboard> | any | null | undefined
): VacacionesDashboard {
  return {
    fechaCorte: asString(payload?.fechaCorte ?? payload?.FechaCorte),

    empleadosActivos: asNumber(payload?.empleadosActivos ?? payload?.EmpleadosActivos),
    empleadosConSaldo: asNumber(payload?.empleadosConSaldo ?? payload?.EmpleadosConSaldo),
    empleadosSinPeriodoAbierto: asNumber(
      payload?.empleadosSinPeriodoAbierto ?? payload?.EmpleadosSinPeriodoAbierto
    ),

    periodosAbiertos: asNumber(payload?.periodosAbiertos ?? payload?.PeriodosAbiertos),
    periodosVencidos: asNumber(payload?.periodosVencidos ?? payload?.PeriodosVencidos),
    periodosPorVencer30Dias: asNumber(
      payload?.periodosPorVencer30Dias ?? payload?.PeriodosPorVencer30Dias
    ),

    saldoTotal: asNumber(payload?.saldoTotal ?? payload?.SaldoTotal),
    diasDerechoTotal: asNumber(payload?.diasDerechoTotal ?? payload?.DiasDerechoTotal),
    diasTomadosTotal: asNumber(payload?.diasTomadosTotal ?? payload?.DiasTomadosTotal),
    diasVencidosTotal: asNumber(payload?.diasVencidosTotal ?? payload?.DiasVencidosTotal),

    movimientosMes: asNumber(payload?.movimientosMes ?? payload?.MovimientosMes),
    movimientosImportacionLegacy: asNumber(
      payload?.movimientosImportacionLegacy ?? payload?.MovimientosImportacionLegacy
    ),

    solicitudesPendientes: asNumber(
      payload?.solicitudesPendientes ?? payload?.SolicitudesPendientes
    ),
    solicitudesAprobadasMes: asNumber(
      payload?.solicitudesAprobadasMes ?? payload?.SolicitudesAprobadasMes
    ),
    solicitudesRechazadasMes: asNumber(
      payload?.solicitudesRechazadasMes ?? payload?.SolicitudesRechazadasMes
    ),
    solicitudesCanceladasMes: asNumber(
      payload?.solicitudesCanceladasMes ?? payload?.SolicitudesCanceladasMes
    ),

    diasSolicitadosPendientes: asNumber(
      payload?.diasSolicitadosPendientes ?? payload?.DiasSolicitadosPendientes
    ),
    diasAprobadosMes: asNumber(payload?.diasAprobadosMes ?? payload?.DiasAprobadosMes),

    topSaldos: asArray<any>(payload?.topSaldos ?? payload?.TopSaldos).map(
      normalizeSaldoAlto
    ),
    periodosPorVencer: asArray<any>(
      payload?.periodosPorVencer ?? payload?.PeriodosPorVencer
    ).map(normalizePeriodoVencer),
    ultimosMovimientos: asArray<any>(
      payload?.ultimosMovimientos ?? payload?.UltimosMovimientos
    ).map(normalizeMovimiento),
    proximosAniversarios: asArray<any>(
      payload?.proximosAniversarios ?? payload?.ProximosAniversarios
    ).map(normalizeAniversario),

    solicitudesPendientesDetalle: asArray<any>(
      payload?.solicitudesPendientesDetalle ?? payload?.SolicitudesPendientesDetalle
    ).map(normalizeSolicitud),
    proximasVacacionesAprobadas: asArray<any>(
      payload?.proximasVacacionesAprobadas ?? payload?.ProximasVacacionesAprobadas
    ).map(normalizeSolicitud),
  };
}

export async function getVacacionesDashboard(): Promise<VacacionesDashboard> {
  const { data } = await api.get<VacacionesDashboard>("/api/Vacaciones/dashboard");
  return normalizeDashboard(data);
}