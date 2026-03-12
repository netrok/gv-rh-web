import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../features/auth/tokenStorage";
import { refreshRequest } from "./auth.api";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const data = await refreshRequest(refreshToken);

    if (!data.accessToken) {
      clearTokens();
      return null;
    }

    setTokens(data.accessToken, data.refreshToken ?? refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    // No intentar refresh contra login/refresh/logout
    const url = originalRequest.url ?? "";
    const isAuthRoute =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout");

    if (isAuthRoute) {
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = performRefresh().finally(() => {
        isRefreshing = false;
      });
    }

    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);