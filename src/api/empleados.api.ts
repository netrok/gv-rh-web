import { api } from "./axios";

export type SexoEmpleado =
  | "NoEspecificado"
  | "Hombre"
  | "Mujer"
  | "Otro";

export type EstadoCivilEmpleado =
  | "NoEspecificado"
  | "Soltero"
  | "Casado"
  | "Divorciado"
  | "Viudo"
  | "UnionLibre";

export type Empleado = {
  id: number;
  numEmpleado: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;

  estatusLaboralActual: string;
  fechaBajaActual?: string | null;
  tipoBajaActual?: string | null;
  fechaReingresoActual?: string | null;
  recontratable: boolean;

  departamentoId?: number | null;
  departamentoNombre?: string | null;
  puestoId?: number | null;
  puestoNombre?: string | null;
  sucursalId?: number | null;
  sucursalNombre?: string | null;

  curp?: string | null;
  rfc?: string | null;
  nss?: string | null;

  sexo: SexoEmpleado;
  estadoCivil: EstadoCivilEmpleado;
  nacionalidad?: string | null;

  direccionCalle?: string | null;
  direccionNumeroExterior?: string | null;
  direccionNumeroInterior?: string | null;
  direccionColonia?: string | null;
  direccionCiudad?: string | null;
  direccionEstado?: string | null;
  direccionCodigoPostal?: string | null;

  codigoPostalFiscal?: string | null;
  entidadFiscal?: string | null;

  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;

  fotoUrl?: string | null;
  tieneFoto: boolean;
  fotoNombreOriginal?: string | null;
  fotoMimeType?: string | null;
  fotoTamanoBytes?: number | null;

  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type EmpleadoListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Empleado[];
};

export type EmpleadoCreateInput = {
  numEmpleado?: string | null;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;

  departamentoId?: number | null;
  puestoId?: number | null;
  sucursalId?: number | null;

  curp?: string | null;
  rfc?: string | null;
  nss?: string | null;

  sexo: SexoEmpleado;
  estadoCivil: EstadoCivilEmpleado;
  nacionalidad?: string | null;

  direccionCalle?: string | null;
  direccionNumeroExterior?: string | null;
  direccionNumeroInterior?: string | null;
  direccionColonia?: string | null;
  direccionCiudad?: string | null;
  direccionEstado?: string | null;
  direccionCodigoPostal?: string | null;

  codigoPostalFiscal?: string | null;
  entidadFiscal?: string | null;

  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
};

export type EmpleadoUpdateInput = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;

  departamentoId?: number | null;
  puestoId?: number | null;
  sucursalId?: number | null;

  curp?: string | null;
  rfc?: string | null;
  nss?: string | null;

  sexo: SexoEmpleado;
  estadoCivil: EstadoCivilEmpleado;
  nacionalidad?: string | null;

  direccionCalle?: string | null;
  direccionNumeroExterior?: string | null;
  direccionNumeroInterior?: string | null;
  direccionColonia?: string | null;
  direccionCiudad?: string | null;
  direccionEstado?: string | null;
  direccionCodigoPostal?: string | null;

  codigoPostalFiscal?: string | null;
  entidadFiscal?: string | null;

  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
};

export type CambiarNumeroEmpleadoInput = {
  numEmpleadoNuevo: string;
  motivo: string;
};

export type SiguienteNumeroEmpleadoResponse = {
  numEmpleadoSugerido: string;
};

export type EmpleadoPhotoResponse = {
  id: number;
  numEmpleado: string;
  fotoUrl: string;
  fotoNombreOriginal?: string | null;
  fotoMimeType?: string | null;
  fotoTamanoBytes?: number | null;
  fotoUpdatedAtUtc?: string | null;
};

export type CreateAccountForEmpleadoInput = {
  email: string;
  role: string;
  password: string;
  isActive: boolean;
};

export type DarBajaEmpleadoInput = {
  fechaBaja: string;
  tipoBaja: string;
  motivo?: string | null;
  comentario?: string | null;
  recontratable?: boolean | null;
  desactivarUsuario: boolean;
};

export type ReingresarEmpleadoInput = {
  fechaReingreso: string;
  comentario?: string | null;
  departamentoId?: number | null;
  puestoId?: number | null;
  sucursalId?: number | null;
  reactivarUsuario: boolean;
};

export type EmpleadoMovimientoLaboral = {
  id: number;
  empleadoId: number;
  tipoMovimiento: string;
  fechaMovimiento: string;
  tipoBaja?: string | null;
  motivo?: string | null;
  comentario?: string | null;
  recontratable?: boolean | null;
  usuarioResponsableId?: number | null;
  createdAtUtc: string;
};

export type EmpleadosQueryParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  activo?: boolean | null;
  departamentoId?: number | null;
  puestoId?: number | null;
  sucursalId?: number | null;
  sort?: string;
  dir?: "asc" | "desc";
};

export type EmpleadosReporteParams = {
  sucursalId?: number | null;
  departamentoId?: number | null;
  puestoId?: number | null;
  activo?: boolean | null;
  estatusLaboral?: string | null;
  fechaIngresoDesde?: string | null;
  fechaIngresoHasta?: string | null;
  search?: string | null;
};

export type EmpleadoImportError = {
  rowNumber: number;
  field: string;
  message: string;
  value?: string | null;
};

export type EmpleadoImportValidateResult = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  canImport?: boolean;
  errors: EmpleadoImportError[];
};

export type EmpleadoImportExecuteResult = {
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  errorRows: number;
  errors: EmpleadoImportError[];
};

export function getEmpleadoNombreCompleto(
  empleado?:
    | Pick<Empleado, "nombres" | "apellidoPaterno" | "apellidoMaterno">
    | null
) {
  if (!empleado) return "";

  return [
    empleado.nombres?.trim() ?? "",
    empleado.apellidoPaterno?.trim() ?? "",
    empleado.apellidoMaterno?.trim() ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function appendIfValue(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value === undefined || value === null || value === "") return;
  params.set(key, String(value));
}

function buildListParams(query: EmpleadosQueryParams) {
  const params = new URLSearchParams();

  appendIfValue(params, "page", query.page);
  appendIfValue(params, "pageSize", query.pageSize);
  appendIfValue(params, "q", query.q);
  appendIfValue(params, "activo", query.activo);
  appendIfValue(params, "departamentoId", query.departamentoId);
  appendIfValue(params, "puestoId", query.puestoId);
  appendIfValue(params, "sucursalId", query.sucursalId);
  appendIfValue(params, "sort", query.sort);
  appendIfValue(params, "dir", query.dir);

  return params;
}

function buildReporteParams(query: EmpleadosReporteParams) {
  const params = new URLSearchParams();

  appendIfValue(params, "sucursalId", query.sucursalId);
  appendIfValue(params, "departamentoId", query.departamentoId);
  appendIfValue(params, "puestoId", query.puestoId);
  appendIfValue(params, "activo", query.activo);
  appendIfValue(params, "estatusLaboral", query.estatusLaboral);
  appendIfValue(params, "fechaIngresoDesde", query.fechaIngresoDesde);
  appendIfValue(params, "fechaIngresoHasta", query.fechaIngresoHasta);
  appendIfValue(params, "search", query.search);

  return params;
}

function buildImportFormData(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function getFileNameFromDisposition(
  contentDisposition?: string,
  fallback = "archivo"
) {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
}

function resolveFileName(
  contentDisposition?: string,
  fallback = "empleados_import_template.xlsx"
) {
  return getFileNameFromDisposition(contentDisposition, fallback);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function resolveEmpleadoPhotoUrl(url?: string | null) {
  if (!url) return null;

  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  const baseUrl =
    typeof api.defaults.baseURL === "string"
      ? trimTrailingSlash(api.defaults.baseURL)
      : "";

  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }

  const rawEnvBase =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    "";

  const normalizedEnvBase = trimTrailingSlash(rawEnvBase);

  if (/^https?:\/\//i.test(normalizedEnvBase)) {
    const root = normalizedEnvBase.endsWith("/api")
      ? normalizedEnvBase.slice(0, -4)
      : normalizedEnvBase;

    return `${root}${normalizedPath}`;
  }

  if (normalizedEnvBase === "/api") {
    return normalizedPath;
  }

  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5041${normalizedPath}`;
  }

  return normalizedPath;
}

export async function getEmpleados(
  query: EmpleadosQueryParams = {}
): Promise<EmpleadoListResponse> {
  const params = buildListParams(query);
  const url = params.toString()
    ? `/api/Empleados?${params.toString()}`
    : "/api/Empleados";

  const { data } = await api.get<EmpleadoListResponse>(url);

  return {
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 0,
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function getEmpleadoById(id: number): Promise<Empleado> {
  const { data } = await api.get<Empleado>(`/api/Empleados/${id}`);
  return data;
}

export async function createEmpleado(
  payload: EmpleadoCreateInput
): Promise<Empleado> {
  const { data } = await api.post<Empleado>("/api/Empleados", payload);
  return data;
}

export async function updateEmpleado(
  id: number,
  payload: EmpleadoUpdateInput
): Promise<Empleado> {
  const { data } = await api.put<Empleado>(`/api/Empleados/${id}`, payload);
  return data;
}

export async function cambiarNumeroEmpleado(
  id: number,
  payload: CambiarNumeroEmpleadoInput
) {
  const { data } = await api.put(`/api/Empleados/${id}/numero-empleado`, payload);
  return data;
}

export async function getSiguienteNumeroEmpleadoSugerido(): Promise<SiguienteNumeroEmpleadoResponse> {
  const { data } = await api.get<SiguienteNumeroEmpleadoResponse>(
    "/api/Empleados/siguiente-numero-sugerido"
  );
  return data;
}

export async function uploadEmpleadoPhoto(
  id: number,
  file: File
): Promise<EmpleadoPhotoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<EmpleadoPhotoResponse>(
    `/api/Empleados/${id}/foto`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function deleteEmpleadoPhoto(id: number): Promise<void> {
  await api.delete(`/api/Empleados/${id}/foto`);
}

export async function deleteEmpleado(id: number): Promise<void> {
  await api.delete(`/api/Empleados/${id}`);
}

export async function restoreEmpleado(id: number): Promise<void> {
  await api.post(`/api/Empleados/${id}/restore`);
}

export async function createAccountForEmpleado(
  id: number,
  payload: CreateAccountForEmpleadoInput
) {
  const { data } = await api.post(
    `/api/Empleados/${id}/create-account`,
    payload
  );
  return data;
}

export async function linkUserByEmail(id: number) {
  const { data } = await api.post(`/api/Empleados/${id}/link-user-by-email`);
  return data;
}

export async function darBajaEmpleado(
  id: number,
  payload: DarBajaEmpleadoInput
) {
  const { data } = await api.post(`/api/Empleados/${id}/baja`, payload);
  return data;
}

export async function reingresarEmpleado(
  id: number,
  payload: ReingresarEmpleadoInput
) {
  const { data } = await api.post(`/api/Empleados/${id}/reingreso`, payload);
  return data;
}

export async function getEmpleadoMovimientos(
  id: number
): Promise<EmpleadoMovimientoLaboral[]> {
  const { data } = await api.get<EmpleadoMovimientoLaboral[]>(
    `/api/Empleados/${id}/movimientos`
  );

  return Array.isArray(data) ? data : [];
}

export async function exportEmpleadosXlsx(params: EmpleadosReporteParams) {
  const query = buildReporteParams(params);

  const url = query.toString()
    ? `/api/Empleados/export/xlsx?${query.toString()}`
    : "/api/Empleados/export/xlsx";

  const response = await api.get(url, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "empleados.xlsx"
  );

  downloadBlob(response.data, fileName);
}

export async function exportEmpleadosPdf(params: EmpleadosReporteParams) {
  const query = buildReporteParams(params);

  const url = query.toString()
    ? `/api/Empleados/export/pdf?${query.toString()}`
    : "/api/Empleados/export/pdf";

  const response = await api.get(url, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    "empleados.pdf"
  );

  downloadBlob(response.data, fileName);
}

export async function exportEmpleadoFichaPdf(id: number) {
  const response = await api.get(`/api/Empleados/${id}/ficha/pdf`, {
    responseType: "blob",
  });

  const fileName = getFileNameFromDisposition(
    response.headers["content-disposition"],
    `ficha_empleado_${id}.pdf`
  );

  downloadBlob(response.data, fileName);
}

export async function downloadEmpleadoImportTemplate(): Promise<void> {
  const response = await api.get("/api/Empleados/import/template", {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = resolveFileName(
    response.headers["content-disposition"],
    "empleados_import_template.xlsx"
  );

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function validateEmpleadoImport(
  file: File
): Promise<EmpleadoImportValidateResult> {
  const formData = buildImportFormData(file);

  const { data } = await api.post<EmpleadoImportValidateResult>(
    "/api/Empleados/import/validate",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function importEmpleadoExcel(
  file: File
): Promise<EmpleadoImportExecuteResult> {
  const formData = buildImportFormData(file);

  const { data } = await api.post<EmpleadoImportExecuteResult>(
    "/api/Empleados/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}