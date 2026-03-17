import { api } from "./axios";

export type SucursalDto = {
  id: number;
  clave: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
  empleadosActivos: number;
};

export type SucursalCreateDto = {
  clave: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
};

export type SucursalUpdateDto = SucursalCreateDto;

export type SucursalQueryParams = {
  activo?: boolean;
  q?: string;
};

export async function getSucursales(
  params?: SucursalQueryParams
): Promise<SucursalDto[]> {
  const { data } = await api.get<SucursalDto[]>("/api/Sucursales", { params });
  return data;
}

export async function getSucursalById(id: number): Promise<SucursalDto> {
  const { data } = await api.get<SucursalDto>(`/api/Sucursales/${id}`);
  return data;
}

export async function createSucursal(
  payload: SucursalCreateDto
): Promise<SucursalDto> {
  const { data } = await api.post<SucursalDto>("/api/Sucursales", payload);
  return data;
}

export async function updateSucursal(
  id: number,
  payload: SucursalUpdateDto
): Promise<SucursalDto> {
  const { data } = await api.put<SucursalDto>(`/api/Sucursales/${id}`, payload);
  return data;
}

export async function deleteSucursal(id: number): Promise<void> {
  await api.delete(`/api/Sucursales/${id}`);
}