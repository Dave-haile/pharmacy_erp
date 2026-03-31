import axios from "axios";
import { getApiErrorMessage } from "../utils/apiErrors";

const API_BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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
