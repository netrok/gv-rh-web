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

export async function previewVacacionesLegacyExcel(
  archivo: File
): Promise<VacacionesLegacyImportPreview> {
  const formData = new FormData();
  formData.append("Archivo", archivo);

  const { data } = await api.post<VacacionesLegacyImportPreview>(
    "/api/Vacaciones/importaciones/legacy-excel/preview",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
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
  const formData = new FormData();

  formData.append("Archivo", archivo);
  formData.append("EmpleadoIds", empleadoIds.join(","));
  formData.append("ImportarTodosElegibles", String(importarTodosElegibles));
  formData.append("PermitirSaldosNegativos", String(permitirSaldosNegativos));

  if (comentario?.trim()) {
    formData.append("Comentario", comentario.trim());
  }

  const { data } = await api.post<VacacionesLegacyImportConfirmResult>(
    "/api/Vacaciones/importaciones/legacy-excel/confirmar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
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