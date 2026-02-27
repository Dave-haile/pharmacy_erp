import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  // ✅ run once on app load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<BackendUser>("/api/me/");
        setUser(res.data);
      } catch (_err) {
        setUser(null);
        // Don't show error toast on initial load to prevent dependency cycles
      }
      setLoading(false);
    })();
  }, []);

  // ✅ fetch current logged-in user
  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get<BackendUser>("/api/me/");
      setUser(res.data);
    } catch (err) {
      setUser(null);
      // Don't show error toast for 401 as it will be handled by interceptor
      if (err.response?.status !== 401) {
        console.error("Failed to fetch user information");
      }
    }
  }, []);

  // ✅ login function
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post(
          "/api/login/",
          { email, password },
          { withCredentials: true }, // ensures cookie is sent
        );

        console.log("Login response:", response);

        // refresh user info after login
        await refreshMe();
      } catch (err) {
        // Show error toast for login failures
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Login failed. Please check your credentials.";
        showError(errorMessage);
        throw err; // Re-throw to let calling component handle if needed
      }
    },
    [refreshMe, showError],
  );

  // ✅ logout function
  const logout = useCallback(async () => {
    try {
      await api.post("/api/logout/", undefined, { withCredentials: true });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe],
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
