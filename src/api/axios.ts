import axios, {
  AxiosError,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../features/auth/tokenStorage";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const browserHost =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "localhost";

const envApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  "";

const API_BASE_URL = trimTrailingSlash(
  envApiBaseUrl || `http://${browserHost}:5041`
);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

function isAuthRoute(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

function redirectToLogin(): void {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || isAuthRoute(originalRequest.url)) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { data } = await refreshClient.post<{
            accessToken: string;
            refreshToken?: string | null;
          }>("/api/auth/refresh", {
            refreshToken: currentRefreshToken,
          });

          if (!data.accessToken) {
            throw new Error("La respuesta de refresh no contiene accessToken");
          }

          setTokens(data.accessToken, data.refreshToken ?? currentRefreshToken);
          return data.accessToken;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers = headers;

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default api;