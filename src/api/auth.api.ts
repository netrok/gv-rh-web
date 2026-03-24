import { api } from "./axios";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  empleadoId?: number | null;
};

export type LoginRequestInput = {
  email: string;
  password: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string | null;
  refreshExpiresAtUtc?: string | null;
  mustChangePassword?: boolean;
  user: AuthUser;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type WhoAmIResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
};

export async function loginRequest(
  input: LoginRequestInput
): Promise<AuthSessionResponse> {
  const payload = {
    email: input.email.trim(),
    password: input.password,
  };

  const { data } = await api.post<AuthSessionResponse>(
    "/api/auth/login",
    payload
  );

  return data;
}

export async function refreshRequest(
  refreshToken: string
): Promise<AuthSessionResponse> {
  if (!refreshToken?.trim()) {
    throw new Error("Refresh token requerido");
  }

  const { data } = await api.post<AuthSessionResponse>("/api/auth/refresh", {
    refreshToken: refreshToken.trim(),
  });

  return data;
}

export async function logoutRequest(
  refreshToken?: string | null
): Promise<void> {
  await api.post("/api/auth/logout", refreshToken?.trim() ? { refreshToken } : {});
}

export async function changePasswordRequest(
  input: ChangePasswordInput
): Promise<void> {
  const payload = {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  };

  await api.post("/api/auth/change-password", payload);
}

export async function whoAmIRequest(): Promise<WhoAmIResponse> {
  const { data } = await api.get<WhoAmIResponse>("/api/auth/whoami");
  return data;
}