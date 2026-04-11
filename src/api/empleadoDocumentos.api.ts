import { api } from "./axios";

export type EmpleadoDocumento = {
  id: number;
  empleadoId: number;
  tipo: number;
  tipoNombre: string;
  nombreArchivoOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
  activo: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type EmpleadoDocumentoChecklistItem = {
  tipo: number;
  tipoNombre: string;
  requerido: boolean;
  tieneDocumento: boolean;
  estatus: string;
  documentoId?: number | null;
  nombreArchivoOriginal?: string | null;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
};

export type EmpleadoDocumentoChecklist = {
  empleadoId: number;
  totalRequeridos: number;
  totalCargados: number;
  totalFaltantes: number;
  totalPorVencer: number;
  totalVencidos: number;
  porcentajeCumplimiento: number;
  items: EmpleadoDocumentoChecklistItem[];
};

export type CreateEmpleadoDocumentoInput = {
  tipo: number;
  archivo: File;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

export type UpdateEmpleadoDocumentoInput = {
  tipo: number;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

export type ReplaceEmpleadoDocumentoInput = {
  archivo: File;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

export const TIPOS_DOCUMENTO_EMPLEADO = [
  { value: 1, label: "INE" },
  { value: 2, label: "CURP" },
  { value: 3, label: "RFC" },
  { value: 4, label: "NSS" },
  { value: 5, label: "Acta de nacimiento" },
  { value: 6, label: "Comprobante de domicilio" },
  { value: 7, label: "Contrato" },
  { value: 8, label: "Carta policía" },
  { value: 9, label: "Comprobante de estudios" },
  { value: 10, label: "Licencia de conducir" },
  { value: 11, label: "Certificado médico" },
  { value: 99, label: "Otro" },
] as const;

export function getTipoDocumentoEmpleadoLabel(tipo: number): string {
  const found = TIPOS_DOCUMENTO_EMPLEADO.find((item) => item.value === tipo);
  return found?.label ?? `Documento ${tipo}`;
}

export function getChecklistStatusLabel(estatus?: string | null): string {
  const normalized = (estatus ?? "").trim().toUpperCase();

  switch (normalized) {
    case "FALTANTE":
      return "Faltante";
    case "CARGADO":
      return "Cargado";
    case "POR_VENCER":
      return "Por vencer";
    case "VENCIDO":
      return "Vencido";
    case "OPCIONAL":
      return "Opcional";
    default:
      return estatus?.trim() || "Sin estatus";
  }
}

export function getChecklistStatusTone(
  estatus?: string | null
): "success" | "warning" | "error" | "default" {
  const normalized = (estatus ?? "").trim().toUpperCase();

  switch (normalized) {
    case "CARGADO":
      return "success";
    case "POR_VENCER":
      return "warning";
    case "VENCIDO":
    case "FALTANTE":
      return "error";
    case "OPCIONAL":
    default:
      return "default";
  }
}

function normalizeNullable(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCreateFormData(input: CreateEmpleadoDocumentoInput) {
  const formData = new FormData();
  formData.append("tipo", String(input.tipo));
  formData.append("archivo", input.archivo);

  const fechaDocumento = normalizeNullable(input.fechaDocumento);
  const fechaVencimiento = normalizeNullable(input.fechaVencimiento);
  const comentario = normalizeNullable(input.comentario);

  if (fechaDocumento) formData.append("fechaDocumento", fechaDocumento);
  if (fechaVencimiento) formData.append("fechaVencimiento", fechaVencimiento);
  if (comentario) formData.append("comentario", comentario);

  return formData;
}

function buildReplaceFormData(input: ReplaceEmpleadoDocumentoInput) {
  const formData = new FormData();
  formData.append("archivo", input.archivo);

  const fechaDocumento = normalizeNullable(input.fechaDocumento);
  const fechaVencimiento = normalizeNullable(input.fechaVencimiento);
  const comentario = normalizeNullable(input.comentario);

  if (fechaDocumento) formData.append("fechaDocumento", fechaDocumento);
  if (fechaVencimiento) formData.append("fechaVencimiento", fechaVencimiento);
  if (comentario) formData.append("comentario", comentario);

  return formData;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getFileNameFromDisposition(
  disposition?: string | null,
  fallback = "documento"
) {
  if (!disposition) return fallback;

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);

  const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) return asciiMatch[1];

  return fallback;
}

export async function getEmpleadoDocumentos(
  empleadoId: number
): Promise<EmpleadoDocumento[]> {
  const { data } = await api.get<EmpleadoDocumento[]>(
    `/api/Empleados/${empleadoId}/documentos`
  );

  return Array.isArray(data) ? data : [];
}

export async function getEmpleadoDocumentosChecklist(
  empleadoId: number
): Promise<EmpleadoDocumentoChecklist> {
  const { data } = await api.get<EmpleadoDocumentoChecklist>(
    `/api/Empleados/${empleadoId}/documentos/checklist`
  );

  return {
    empleadoId: data?.empleadoId ?? empleadoId,
    totalRequeridos: data?.totalRequeridos ?? 0,
    totalCargados: data?.totalCargados ?? 0,
    totalFaltantes: data?.totalFaltantes ?? 0,
    totalPorVencer: data?.totalPorVencer ?? 0,
    totalVencidos: data?.totalVencidos ?? 0,
    porcentajeCumplimiento: data?.porcentajeCumplimiento ?? 0,
    items: Array.isArray(data?.items) ? data.items : [],
  };
}

export async function createEmpleadoDocumento(
  empleadoId: number,
  input: CreateEmpleadoDocumentoInput
): Promise<EmpleadoDocumento> {
  const formData = buildCreateFormData(input);

  const { data } = await api.post<EmpleadoDocumento>(
    `/api/Empleados/${empleadoId}/documentos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function updateEmpleadoDocumento(
  documentoId: number,
  input: UpdateEmpleadoDocumentoInput
): Promise<EmpleadoDocumento> {
  const payload = {
    tipo: input.tipo,
    fechaDocumento: normalizeNullable(input.fechaDocumento),
    fechaVencimiento: normalizeNullable(input.fechaVencimiento),
    comentario: normalizeNullable(input.comentario),
  };

  const { data } = await api.put<EmpleadoDocumento>(
    `/api/EmpleadoDocumentos/${documentoId}`,
    payload
  );

  return data;
}

export async function replaceEmpleadoDocumento(
  documentoId: number,
  input: ReplaceEmpleadoDocumentoInput
): Promise<EmpleadoDocumento> {
  const formData = buildReplaceFormData(input);

  const { data } = await api.post<EmpleadoDocumento>(
    `/api/EmpleadoDocumentos/${documentoId}/reemplazar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function deleteEmpleadoDocumento(documentoId: number): Promise<void> {
  await api.delete(`/api/EmpleadoDocumentos/${documentoId}`);
}

export async function getEmpleadoDocumentoBlob(
  documentoId: number
): Promise<Blob> {
  const response = await api.get(`/api/EmpleadoDocumentos/${documentoId}/download`, {
    responseType: "blob",
  });

  return response.data as Blob;
}

export async function downloadEmpleadoDocumento(
  documentoId: number,
  fallbackFileName?: string
): Promise<void> {
  const response = await api.get(`/api/EmpleadoDocumentos/${documentoId}/download`, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    fallbackFileName || "documento"
  );

  downloadBlob(response.data as Blob, fileName);
}