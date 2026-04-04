import axios from "axios";
import { getApiErrorMessage } from "../utils/apiErrors";

const ACCESS_TOKEN_STORAGE_KEY = "pharmacy_erp_access_token";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

const setStoredAccessToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

const clearStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const friendlyMessage = getApiErrorMessage(error);
      const currentData =
        error.response && typeof error.response.data === "object"
          ? error.response.data
          : {};

      if (error.response) {
        error.response.data = {
          ...currentData,
          error: (currentData as { error?: string }).error || friendlyMessage,
          message:
            (currentData as { message?: string }).message || friendlyMessage,
        };
      }
    }

    return Promise.reject(error);
  },
);

export default api;
export { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken };
