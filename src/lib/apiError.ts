import axios from "axios";

export type AppError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

function pickMessageFromResponseData(data: any): string | undefined {
  if (!data) return undefined;

  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.title === "string" && data.title.trim()) return data.title;
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;

  if (Array.isArray(data?.errors)) {
    const first = data.errors.find((x: unknown) => typeof x === "string");
    if (first) return first;
  }

  if (data?.errors && typeof data.errors === "object") {
    const values = Object.values(data.errors).flat();
    const first = values.find((x) => typeof x === "string");
    if (typeof first === "string") return first;
  }

  return undefined;
}

export function toAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    const message =
      pickMessageFromResponseData(responseData) ??
      (status === 401
        ? "Tu sesión ya no es válida."
        : status === 403
        ? "No tienes permiso para realizar esta acción."
        : status === 404
        ? "No se encontró el recurso solicitado."
        : status && status >= 500
        ? "El servidor devolvió un error."
        : error.message || "Ocurrió un error inesperado.");

    return {
      message,
      status,
      code: error.code,
      details: responseData,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "Ocurrió un error inesperado.",
  };
}

export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  const parsed = toAppError(error);
  return parsed.message || fallback;
}