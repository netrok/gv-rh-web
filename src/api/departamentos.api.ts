import { api } from "./axios";

export type Departamento = {
  id: number;
  clave: string;
  nombre: string;
  activo: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type SaveDepartamentoInput = {
  clave: string;
  nombre: string;
  activo: boolean;
};

type DepartamentoListEnvelope =
  | Departamento[]
  | {
      items?: Departamento[];
      data?: Departamento[];
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };

function normalizeDepartamentos(payload: DepartamentoListEnvelope): Departamento[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

export async function getDepartamentos() {
  const { data } = await api.get<DepartamentoListEnvelope>(
    "/api/Departamentos?page=1&pageSize=500&sort=nombre&dir=asc"
  );

  return normalizeDepartamentos(data);
}

export async function createDepartamento(input: SaveDepartamentoInput) {
  const { data } = await api.post<Departamento>("/api/Departamentos", input);
  return data;
}

export async function updateDepartamento(id: number, input: SaveDepartamentoInput) {
  const { data } = await api.put<Departamento>(`/api/Departamentos/${id}`, input);
  return data;
}