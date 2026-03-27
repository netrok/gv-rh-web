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
  updatedAtUtc?: string | null;
};

export type EmpleadoDocumentoChecklistItem = {
  tipo: number;
  tipoNombre: string;
  requerido: boolean;
  tieneDocumento: boolean;
  estatus: "CARGADO" | "FALTANTE" | "POR_VENCER" | "VENCIDO" | "OPCIONAL";
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

export type EmpleadoDocumentoCreateInput = {
  tipo: number;
  archivo: File;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

export type EmpleadoDocumentoUpdateInput = {
  tipo: number;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

export type EmpleadoDocumentoReplaceInput = {
  archivo: File;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  comentario?: string | null;
};

// Alias para compatibilidad con imports viejos
export type CreateEmpleadoDocumentoInput = EmpleadoDocumentoCreateInput;
export type UpdateEmpleadoDocumentoInput = EmpleadoDocumentoUpdateInput;
export type ReplaceEmpleadoDocumentoInput = EmpleadoDocumentoReplaceInput;

export type TipoDocumentoOption = {
  value: number;
  label: string;
};

export type ChecklistStatusTone = "success" | "warning" | "error" | "default";

export const TIPOS_DOCUMENTO_EMPLEADO: TipoDocumentoOption[] = [
  { value: 1, label: "INE" },
  { value: 2, label: "CURP" },
  { value: 3, label: "RFC" },
  { value: 4, label: "NSS" },
  { value: 5, label: "Acta de nacimiento" },
  { value: 6, label: "Comprobante de domicilio" },
  { value: 7, label: "Contrato" },
  { value: 8, label: "Constancia fiscal" },
  { value: 9, label: "Comprobante de estudios" },
  { value: 10, label: "Licencia de conducir" },
  { value: 11, label: "Certificado médico" },
  { value: 99, label: "Otro" },
];

export function getTipoDocumentoEmpleadoLabel(tipo: number): string {
  return (
    TIPOS_DOCUMENTO_EMPLEADO.find((item) => item.value === tipo)?.label ??
    `Tipo ${tipo}`
  );
}

export function getChecklistStatusLabel(
  estatus: EmpleadoDocumentoChecklistItem["estatus"]
): string {
  switch (estatus) {
    case "CARGADO":
      return "Cargado";
    case "FALTANTE":
      return "Faltante";
    case "POR_VENCER":
      return "Por vencer";
    case "VENCIDO":
      return "Vencido";
    case "OPCIONAL":
      return "Opcional";
    default:
      return estatus;
  }
}

export function getChecklistStatusTone(
  estatus: EmpleadoDocumentoChecklistItem["estatus"]
): ChecklistStatusTone {
  switch (estatus) {
    case "CARGADO":
      return "success";
    case "POR_VENCER":
      return "warning";
    case "VENCIDO":
      return "error";
    case "FALTANTE":
    case "OPCIONAL":
    default:
      return "default";
  }
}

function appendIfPresent(
  formData: FormData,
  key: string,
  value?: string | null
): void {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, value);
  }
}

function normalizeNullableString(value?: string | null): string | null {
  if (value == null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getFileNameFromContentDisposition(
  contentDisposition?: string
): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i
  );
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
    } catch {
      return utf8Match[1].replace(/["']/g, "");
    }
  }

  const plainMatch = contentDisposition.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (plainMatch?.[2]) {
    return plainMatch[2];
  }

  return null;
}

export async function getEmpleadoDocumentos(
  empleadoId: number
): Promise<EmpleadoDocumento[]> {
  const { data } = await api.get<EmpleadoDocumento[]>(
    `/api/Empleados/${empleadoId}/documentos`
  );
  return data;
}

export async function getEmpleadoDocumentosChecklist(
  empleadoId: number
): Promise<EmpleadoDocumentoChecklist> {
  const { data } = await api.get<EmpleadoDocumentoChecklist>(
    `/api/Empleados/${empleadoId}/documentos/checklist`
  );
  return data;
}

export async function createEmpleadoDocumento(
  empleadoId: number,
  input: EmpleadoDocumentoCreateInput
): Promise<EmpleadoDocumento> {
  const formData = new FormData();
  formData.append("tipo", String(input.tipo));
  formData.append("archivo", input.archivo);
  appendIfPresent(formData, "fechaDocumento", input.fechaDocumento);
  appendIfPresent(formData, "fechaVencimiento", input.fechaVencimiento);
  appendIfPresent(
    formData,
    "comentario",
    normalizeNullableString(input.comentario)
  );

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
  input: EmpleadoDocumentoUpdateInput
): Promise<EmpleadoDocumento> {
  const payload = {
    tipo: input.tipo,
    fechaDocumento: normalizeNullableString(input.fechaDocumento),
    fechaVencimiento: normalizeNullableString(input.fechaVencimiento),
    comentario: normalizeNullableString(input.comentario),
  };

  const { data } = await api.put<EmpleadoDocumento>(
    `/api/EmpleadoDocumentos/${documentoId}`,
    payload
  );

  return data;
}

export async function replaceEmpleadoDocumento(
  documentoId: number,
  input: EmpleadoDocumentoReplaceInput
): Promise<EmpleadoDocumento> {
  const formData = new FormData();
  formData.append("archivo", input.archivo);
  appendIfPresent(formData, "fechaDocumento", input.fechaDocumento);
  appendIfPresent(formData, "fechaVencimiento", input.fechaVencimiento);
  appendIfPresent(
    formData,
    "comentario",
    normalizeNullableString(input.comentario)
  );

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

export async function deleteEmpleadoDocumento(
  documentoId: number
): Promise<void> {
  await api.delete(`/api/EmpleadoDocumentos/${documentoId}`);
}

export async function getEmpleadoDocumentoBlob(
  documentoId: number
): Promise<Blob> {
  const response = await api.get(
    `/api/EmpleadoDocumentos/${documentoId}/download`,
    {
      responseType: "blob",
    }
  );

  return response.data as Blob;
}

export async function downloadEmpleadoDocumento(
  documentoId: number,
  fallbackFileName?: string
): Promise<void> {
  const response = await api.get(
    `/api/EmpleadoDocumentos/${documentoId}/download`,
    {
      responseType: "blob",
    }
  );

  const blob = response.data as Blob;
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
    fallbackFileName ||
    `documento_${documentoId}`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function getEmpleadoDocumentoDownloadUrl(documentoId: number): string {
  const baseUrl =
    (api.defaults.baseURL ?? "").replace(/\/$/, "") || window.location.origin;

  return `${baseUrl}/api/EmpleadoDocumentos/${documentoId}/download`;
}