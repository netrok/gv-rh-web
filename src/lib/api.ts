import axios from "axios";
import { toAppError } from "./apiError";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(toAppError(error))
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toAppError(error))
);