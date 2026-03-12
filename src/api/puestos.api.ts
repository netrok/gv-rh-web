import { api } from "./axios";

export type Puesto = {
  id: number;
  clave: string;
  nombre: string;
  departamentoId: number;
  activo: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type SavePuestoInput = {
  clave: string;
  nombre: string;
  departamentoId: number;
  activo: boolean;
};

type RawPuesto = {
  id?: number | string;
  clave?: string;
  nombre?: string;
  departamentoId?: number | string | null;
  departamentoID?: number | string | null;
  departamento?: {
    id?: number | string | null;
  } | null;
  activo?: boolean | string | number;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

type PuestoListEnvelope =
  | RawPuesto[]
  | {
      items?: RawPuesto[];
      data?: RawPuesto[];
    };

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}

function normalizePuesto(raw: RawPuesto): Puesto {
  return {
    id: toNumber(raw.id),
    clave: raw.clave ?? "",
    nombre: raw.nombre ?? "",
    departamentoId: toNumber(
      raw.departamentoId ??
        raw.departamentoID ??
        raw.departamento?.id ??
        0
    ),
    activo: toBoolean(raw.activo),
    createdAtUtc: raw.createdAtUtc,
    updatedAtUtc: raw.updatedAtUtc,
  };
}

function normalizePuestos(payload: PuestoListEnvelope): Puesto[] {
  const rows = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];
  return rows.map(normalizePuesto);
}

export async function getPuestos() {
  const { data } = await api.get<PuestoListEnvelope>("/api/Puestos");
  return normalizePuestos(data);
}

export async function createPuesto(input: SavePuestoInput) {
  const { data } = await api.post<Puesto>("/api/Puestos", input);
  return data;
}

export async function updatePuesto(id: number, input: SavePuestoInput) {
  const { data } = await api.put<Puesto | void>(`/api/Puestos/${id}`, input);
  return data;
}