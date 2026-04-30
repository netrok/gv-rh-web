import { api } from "./axios";

export type VacacionesLegacyImportPreviewItem = {
  hoja: string;
  filaReferencia?: number | null;

  empleadoEncontrado: boolean;
  empleadoId?: number | null;

  numEmpleadoExcel?: string | null;
  numEmpleadoSistema?: string | null;

  nombreExcel?: string | null;
  nombreSistema?: string | null;

  rfcExcel?: string | null;
  nssExcel?: string | null;
  puestoExcel?: string | null;
  fechaIngresoExcel?: string | null;

  anioServicioSugerido?: number | null;

  diasDerechoExcel?: number | null;
  diasDisfrutadosExcel?: number | null;
  diasPagadosExcel?: number | null;
  saldoExcel?: number | null;

  saldoSistemaActual?: number | null;
  diferencia?: number | null;

  tienePeriodoSistema: boolean;

  accionSugerida?: string | null;
  puedeImportar: boolean;
  error?: string | null;

  observacionesOriginales?: string | null;
};

export type VacacionesLegacyImportPreview = {
  archivo: string;
  totalHojas: number;
  hojasAnalizadas: number;
  empleadosDetectados: number;
  empleadosNoEncontrados: number;
  conDiferencias: number;
  advertencias: string[];
  items: VacacionesLegacyImportPreviewItem[];
};

export type VacacionesLegacyConciliacionCandidato = {
  empleadoId: number;
  numEmpleado: string;
  nombre: string;
  rfc?: string | null;
  nss?: string | null;
  estatusLaboral: string;
  puntaje: number;
  motivos: string[];
};

export type VacacionesLegacyConciliacionItem = {
  hoja: string;
  filaReferencia?: number | null;

  estado: "ENCONTRADO" | "NO_ENCONTRADO" | "POSIBLE_COINCIDENCIA" | string;
  accionSugerida: string;

  empleadoId?: number | null;

  numEmpleadoExcel?: string | null;
  nombreExcel?: string | null;
  rfcExcel?: string | null;
  nssExcel?: string | null;
  puestoExcel?: string | null;
  fechaIngresoExcel?: string | null;

  numEmpleadoSistema?: string | null;
  nombreSistema?: string | null;
  rfcSistema?: string | null;
  nssSistema?: string | null;
  estatusLaboralSistema?: string | null;

  saldoExcel?: number | null;
  saldoSistemaActual?: number | null;
  diferenciaSaldo?: number | null;

  tienePeriodoSistema: boolean;
  puedeImportar: boolean;

  error?: string | null;
  observacionesOriginales?: string | null;

  diferencias: string[];
  posiblesCoincidencias: VacacionesLegacyConciliacionCandidato[];
};

export type VacacionesLegacyConciliacion = {
  archivo: string;
  totalItemsPreview: number;
  encontrados: number;
  noEncontrados: number;
  posiblesCoincidencias: number;
  conDiferencias: number;
  advertencias: string[];
  items: VacacionesLegacyConciliacionItem[];
};

export type VacacionesLegacyImportConfirmItem = {
  hoja: string;
  empleadoId?: number | null;
  numEmpleado?: string | null;
  nombreEmpleado?: string | null;

  saldoExcel?: number | null;
  saldoImportado?: number | null;

  vacacionPeriodoId?: number | null;
  vacacionMovimientoId?: number | null;

  importado: boolean;
  accion?: string | null;
  mensaje?: string | null;
  error?: string | null;
};

export type VacacionesLegacyImportConfirmResult = {
  archivo: string;
  totalPreviewItems: number;
  solicitados: number;
  importados: number;
  omitidos: number;
  errores: number;
  advertencias: string[];
  items: VacacionesLegacyImportConfirmItem[];
};

export type ConfirmarImportacionVacacionesParams = {
  archivo: File;
  empleadoIds?: number[];
  importarTodosElegibles?: boolean;
  permitirSaldosNegativos?: boolean;
  comentario?: string;
};

function createExcelFormData(archivo: File): FormData {
  const formData = new FormData();
  formData.append("Archivo", archivo);
  return formData;
}

const multipartHeaders = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

export async function previewVacacionesLegacyExcel(
  archivo: File
): Promise<VacacionesLegacyImportPreview> {
  const formData = createExcelFormData(archivo);

  const { data } = await api.post<VacacionesLegacyImportPreview>(
    "/api/Vacaciones/importaciones/legacy-excel/preview",
    formData,
    multipartHeaders
  );

  return data;
}

export async function conciliarVacacionesLegacyExcel(
  archivo: File
): Promise<VacacionesLegacyConciliacion> {
  const formData = createExcelFormData(archivo);

  const { data } = await api.post<VacacionesLegacyConciliacion>(
    "/api/Vacaciones/importaciones/legacy-excel/conciliar",
    formData,
    multipartHeaders
  );

  return data;
}

export async function confirmarVacacionesLegacyExcel({
  archivo,
  empleadoIds = [],
  importarTodosElegibles = false,
  permitirSaldosNegativos = false,
  comentario,
}: ConfirmarImportacionVacacionesParams): Promise<VacacionesLegacyImportConfirmResult> {
  const formData = createExcelFormData(archivo);

  formData.append("EmpleadoIds", empleadoIds.join(","));
  formData.append("ImportarTodosElegibles", String(importarTodosElegibles));
  formData.append("PermitirSaldosNegativos", String(permitirSaldosNegativos));

  if (comentario?.trim()) {
    formData.append("Comentario", comentario.trim());
  }

  const { data } = await api.post<VacacionesLegacyImportConfirmResult>(
    "/api/Vacaciones/importaciones/legacy-excel/confirmar",
    formData,
    multipartHeaders
  );

  return data;
}

export function getEstadoConciliacionLabel(value?: string | null): string {
  switch (value) {
    case "ENCONTRADO":
      return "Encontrado";
    case "NO_ENCONTRADO":
      return "No encontrado";
    case "POSIBLE_COINCIDENCIA":
      return "Posible coincidencia";
    default:
      return value || "Sin estado";
  }
}

export function getAccionImportacionVacacionesLabel(value?: string | null): string {
  switch (value) {
    case "IMPORTAR_SALDO_INICIAL":
      return "Importar saldo inicial";
    case "EMPLEADO_NO_ENCONTRADO":
      return "Empleado no encontrado";
    case "SIN_CAMBIOS":
      return "Sin cambios";
    case "REVISAR_DIFERENCIA_CON_SISTEMA":
      return "Revisar diferencia";
    case "REVISION_MANUAL":
      return "Revisión manual";
    case "IMPORTADO_SALDO_INICIAL":
      return "Saldo inicial importado";
    case "OMITIDO":
      return "Omitido";
    case "ERROR":
      return "Error";
    default:
      return value || "Sin acción";
  }
}

export function getAccionImportacionVacacionesColor(
  value?: string | null
): "success" | "warning" | "error" | "info" | "default" {
  switch (value) {
    case "IMPORTAR_SALDO_INICIAL":
    case "IMPORTADO_SALDO_INICIAL":
    case "SIN_CAMBIOS":
      return "success";
    case "REVISAR_DIFERENCIA_CON_SISTEMA":
    case "REVISION_MANUAL":
    case "OMITIDO":
      return "warning";
    case "EMPLEADO_NO_ENCONTRADO":
    case "ERROR":
      return "error";
    default:
      return "default";
  }
}