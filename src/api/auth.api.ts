import { api } from "./axios";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken?: string | null;
};

export async function loginRequest(payload: LoginRequest) {
  const { data } = await api.post<AuthTokensResponse>("/api/auth/login", payload);
  return data;
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await api.post<AuthTokensResponse>("/api/auth/refresh", {
    refreshToken,
  });

  return data;
}

export async function logoutRequest(refreshToken?: string | null) {
  await api.post("/api/auth/logout", {
    refreshToken,
  });
}