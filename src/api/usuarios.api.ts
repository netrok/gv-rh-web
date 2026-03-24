import { api } from "./axios";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  activo: boolean;
  mustChangePassword?: boolean;
  empleadoId?: number | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

export type SaveUsuarioInput = {
  nombre: string;
  email: string;
  roles: string[];
  activo: boolean;
  password?: string;
};

type AnyRecord = Record<string, unknown>;

const USUARIOS_ENDPOINT_CANDIDATES = [
  "/api/Usuarios",
  "/api/Usuario",
  "/api/Users",
  "/api/User",
] as const;

let resolvedUsuariosEndpoint: string | null = null;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  return [];
}

function parseBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return fallback;
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUsuario(raw: AnyRecord): Usuario {
  const email = String(raw.email ?? "");
  const fallbackNombre = email ? email.split("@")[0] : "";

  return {
    id: Number(raw.id ?? raw.usuarioId ?? raw.userId ?? 0),
    nombre: String(
      raw.nombre ??
        raw.name ??
        raw.fullName ??
        raw.userName ??
        fallbackNombre
    ),
    email,
    roles: toStringArray(raw.roles ?? raw.roleNames ?? raw.role),
    activo: parseBoolean(raw.activo ?? raw.isActive, true),
    mustChangePassword: parseBoolean(raw.mustChangePassword, false),
    empleadoId: parseNullableNumber(raw.empleadoId),
    createdAtUtc: (raw.createdAtUtc ??
      raw.createdAt ??
      raw.fechaCreacion ??
      null) as string | null,
    updatedAtUtc: (raw.updatedAtUtc ??
      raw.updatedAt ??
      raw.fechaActualizacion ??
      null) as string | null,
  };
}

function unwrapArray(payload: unknown): AnyRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    const candidates = [
      payload.items,
      payload.data,
      payload.results,
      payload.usuarios,
      payload.value,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(isRecord);
      }
    }
  }

  return [];
}

function unwrapObject(payload: unknown): AnyRecord {
  if (isRecord(payload)) {
    const candidates = [
      payload.data,
      payload.item,
      payload.usuario,
      payload.value,
    ];

    for (const candidate of candidates) {
      if (isRecord(candidate)) {
        return candidate;
      }
    }

    return payload;
  }

  return {};
}

function buildUsuarioPayload(input: SaveUsuarioInput): AnyRecord {
  const cleanRoles = (input.roles ?? []).map((r) => r.trim()).filter(Boolean);
  const primaryRole = cleanRoles[0] ?? "";

  return {
    nombre: input.nombre?.trim() ?? "",
    email: input.email?.trim() ?? "",
    roles: cleanRoles,
    role: primaryRole,
    activo: input.activo,
    isActive: input.activo,
    ...(input.password?.trim() ? { password: input.password.trim() } : {}),
  };
}

async function resolveUsuariosEndpoint(): Promise<string> {
  if (resolvedUsuariosEndpoint) {
    return resolvedUsuariosEndpoint;
  }

  let lastError: unknown = null;

  for (const endpoint of USUARIOS_ENDPOINT_CANDIDATES) {
    try {
      await api.get(endpoint, {
        params: { page: 1, pageSize: 1 },
      });

      resolvedUsuariosEndpoint = endpoint;
      return endpoint;
    } catch (error: any) {
      lastError = error;

      const status = error?.response?.status;

      if (status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("No se encontró un endpoint válido para usuarios.");
}

export async function getUsuarios(): Promise<Usuario[]> {
  const endpoint = await resolveUsuariosEndpoint();
  const { data } = await api.get(endpoint, {
    params: { page: 1, pageSize: 50 },
  });

  return unwrapArray(data).map(normalizeUsuario);
}

export async function createUsuario(input: SaveUsuarioInput): Promise<Usuario> {
  const endpoint = await resolveUsuariosEndpoint();
  const { data } = await api.post(endpoint, buildUsuarioPayload(input));
  return normalizeUsuario(unwrapObject(data));
}

export async function updateUsuario(
  id: number,
  input: SaveUsuarioInput
): Promise<Usuario> {
  const endpoint = await resolveUsuariosEndpoint();
  const { data } = await api.put(`${endpoint}/${id}`, buildUsuarioPayload(input));
  return normalizeUsuario(unwrapObject(data));
}