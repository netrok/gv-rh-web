import { api } from "./axios";

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
  departamentoId?: number | null;
  puestoId?: number | null;
};

export type SaveEmpleadoInput = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso: string;
  activo: boolean;
  departamentoId: number;
  puestoId: number;
};

type EmpleadoListEnvelope =
  | Empleado[]
  | {
      items?: Empleado[];
      data?: Empleado[];
    };

function normalizeEmpleados(payload: EmpleadoListEnvelope): Empleado[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

export async function getEmpleados() {
  const { data } = await api.get<EmpleadoListEnvelope>("/api/Empleados");
  return normalizeEmpleados(data);
}

export async function createEmpleado(input: SaveEmpleadoInput) {
  const { data } = await api.post<Empleado>("/api/Empleados", input);
  return data;
}

export async function updateEmpleado(id: number, input: SaveEmpleadoInput) {
  const { data } = await api.put<Empleado | void>(`/api/Empleados/${id}`, input);
  return data;
}