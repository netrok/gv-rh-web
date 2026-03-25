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

export type TipoDocumentoOption = {
  value: number;
  label: string;
};

export const TIPOS_DOCUMENTO_EMPLEADO: TipoDocumentoOption[] = [
  { value: 1, label: "INE" },
  { value: 2, label: "CURP" },
  { value: 3, label: "RFC" },
  { value: 4, label: "NSS" },
  { value: 5, label: "Acta de nacimiento" },
  { value: 6, label: "Comprobante de domicilio" },
  { value: 7, label: "Contrato" },
  { value: 8, label: "Constancia fiscal" },
  { value: 9, label: "Certificado médico" },
  { value: 10, label: "Otro" },
];

export function getTipoDocumentoEmpleadoLabel(tipo: number): string {
  return (
    TIPOS_DOCUMENTO_EMPLEADO.find((item) => item.value === tipo)?.label ??
    `Tipo ${tipo}`
  );
}

export async function getEmpleadoDocumentos(
  empleadoId: number
): Promise<EmpleadoDocumento[]> {
  const { data } = await api.get<EmpleadoDocumento[]>(
    `/api/Empleados/${empleadoId}/documentos`
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

  if (input.fechaDocumento) {
    formData.append("fechaDocumento", input.fechaDocumento);
  }

  if (input.fechaVencimiento) {
    formData.append("fechaVencimiento", input.fechaVencimiento);
  }

  if (input.comentario && input.comentario.trim()) {
    formData.append("comentario", input.comentario.trim());
  }

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
  id: number,
  input: EmpleadoDocumentoUpdateInput
): Promise<EmpleadoDocumento> {
  const payload = {
    tipo: input.tipo,
    fechaDocumento: normalizeNullableString(input.fechaDocumento),
    fechaVencimiento: normalizeNullableString(input.fechaVencimiento),
    comentario: normalizeNullableString(input.comentario),
  };

  const { data } = await api.put<EmpleadoDocumento>(
    `/api/EmpleadoDocumentos/${id}`,
    payload
  );

  return data;
}

export async function deleteEmpleadoDocumento(id: number): Promise<void> {
  await api.delete(`/api/EmpleadoDocumentos/${id}`);
}

export async function downloadEmpleadoDocumento(
  id: number,
  fallbackFileName?: string
): Promise<void> {
  const response = await api.get<Blob>(`/api/EmpleadoDocumentos/${id}/download`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download =
    getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
    fallbackFileName ||
    `documento_${id}`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
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

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
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