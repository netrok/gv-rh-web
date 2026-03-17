import { api } from "./axios";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken?: string | null;
};

export async function loginRequest(
  payload: LoginRequest
): Promise<AuthTokensResponse> {
  const { data } = await api.post<AuthTokensResponse>("/api/auth/login", payload);
  return data;
}

export async function refreshRequest(
  refreshToken: string
): Promise<AuthTokensResponse> {
  if (!refreshToken?.trim()) {
    throw new Error("Refresh token requerido");
  }

  const { data } = await api.post<AuthTokensResponse>("/api/auth/refresh", {
    refreshToken,
  });

  return data;
}

export async function logoutRequest(
  refreshToken?: string | null
): Promise<void> {
  await api.post("/api/auth/logout", refreshToken ? { refreshToken } : {});
}