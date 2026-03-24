import { api } from "./axios";

export type Usuario = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  empleadoId?: number | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type UserRoleOption = {
  value: string;
  label: string;
};

export type UsersListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Usuario[];
};

export type GetUsersParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  active?: boolean | null;
};

export type CreateUserInput = {
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  empleadoId?: number | null;
};

export type UpdateUserInput = {
  role: string;
  isActive: boolean;
  empleadoId?: number | null;
};

export type ResetUserPasswordInput = {
  newPassword?: string;
};

export type ResetUserPasswordResponse = {
  message: string;
  tempPassword: string;
};

export type LinkEmpleadoByEmailResponse = {
  message: string;
  user: Usuario;
  empleado: {
    id: number;
    numEmpleado: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    email?: string | null;
  };
};

function normalizeRole(role?: string | null): string {
  return (role ?? "").trim().toUpperCase();
}

export async function getUsers(
  params: GetUsersParams = {}
): Promise<UsersListResponse> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.page) queryParams.page = params.page;
  if (params.pageSize) queryParams.pageSize = params.pageSize;
  if (params.q?.trim()) queryParams.q = params.q.trim();
  if (params.role?.trim()) queryParams.role = normalizeRole(params.role);
  if (typeof params.active === "boolean") queryParams.active = params.active;

  const { data } = await api.get<UsersListResponse>("/api/Users", {
    params: queryParams,
  });

  return data;
}

export async function getUserById(id: number): Promise<Usuario> {
  const { data } = await api.get<Usuario>(`/api/Users/${id}`);
  return data;
}

export async function getUserRoles(): Promise<UserRoleOption[]> {
  const { data } = await api.get<UserRoleOption[]>("/api/Users/roles");
  return data;
}

export async function createUser(input: CreateUserInput): Promise<Usuario> {
  const payload = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: normalizeRole(input.role),
    isActive: input.isActive,
    empleadoId: input.empleadoId ?? null,
  };

  const { data } = await api.post<Usuario>("/api/Users", payload);
  return data;
}

export async function updateUser(
  id: number,
  input: UpdateUserInput
): Promise<Usuario> {
  const payload = {
    role: normalizeRole(input.role),
    isActive: input.isActive,
    empleadoId: input.empleadoId ?? null,
  };

  const { data } = await api.put<Usuario>(`/api/Users/${id}`, payload);
  return data;
}

export async function resetUserPassword(
  id: number,
  input: ResetUserPasswordInput = {}
): Promise<ResetUserPasswordResponse> {
  const payload = {
    newPassword: input.newPassword?.trim() || undefined,
  };

  const { data } = await api.post<ResetUserPasswordResponse>(
    `/api/Users/${id}/reset-password`,
    payload
  );

  return data;
}

export async function linkEmpleadoByEmail(
  id: number
): Promise<LinkEmpleadoByEmailResponse> {
  const { data } = await api.post<LinkEmpleadoByEmailResponse>(
    `/api/Users/${id}/link-empleado-by-email`
  );

  return data;
}