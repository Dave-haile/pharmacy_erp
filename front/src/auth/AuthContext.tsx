import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import api, {
  clearStoredAccessToken,
  setStoredAccessToken,
} from "../services/api";
import { useToast } from "../hooks/useToast";

export type BackendUserRole = "admin" | "manager" | "pharmacist" | "cashier";

export type BackendUser = {
  id: number;
  email: string;
  role: BackendUserRole;
};

type AuthContextValue = {
  user: BackendUser | null;
  loading: boolean;
  authCheckError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authCheckError, setAuthCheckError] = useState<string | null>(null);
  const { showError } = useToast();

  const isUnauthorizedAuthError = useCallback((error: unknown) => {
    return (
      axios.isAxiosError(error) &&
      [401, 403].includes(error.response?.status ?? 0)
    );
  }, []);

  const getAuthCheckErrorMessage = useCallback((error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return "We couldn't verify your session. Please try again.";
    }

    if (!error.response) {
      return "The server is unreachable. Please check your connection and try again.";
    }

    return (
      error.response.data?.message ||
      error.response.data?.error ||
      "We couldn't verify your session because the server returned an unexpected error."
    );
  }, []);

  const refreshMe = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get<BackendUser>("/api/me/");
      setUser(res.data);
      setAuthCheckError(null);
    } catch (error) {
      if (isUnauthorizedAuthError(error)) {
        clearStoredAccessToken();
        setUser(null);
        setAuthCheckError(null);
      } else {
        setAuthCheckError(getAuthCheckErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthCheckErrorMessage, isUnauthorizedAuthError]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post<{
          message: string;
          access_token?: string;
          token_type?: string;
          expires_at?: string;
        }>("/api/login/", { email, password });

        const accessToken = response.data.access_token;
        if (accessToken) {
          setStoredAccessToken(accessToken);
        }

        await refreshMe();
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message ||
            err.response?.data?.error ||
            "Login failed. Please check your credentials."
          : "Login failed. Please check your credentials.";
        showError(errorMessage);
        throw err;
      }
    },
    [refreshMe, showError],
  );

  const logout = useCallback(async () => {
    try {
      const response = await api.post("/api/logout/");
      console.log(response);
    } finally {
      clearStoredAccessToken();
      setUser(null);
      setAuthCheckError(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, authCheckError, login, logout, refreshMe }),
    [user, loading, authCheckError, login, logout, refreshMe],
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
