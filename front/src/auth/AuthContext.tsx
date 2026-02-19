import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

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

  // ✅ fetch current logged-in user
  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get<BackendUser>("/api/me/");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  }, []);

  // ✅ run once on app load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  // ✅ login function
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post(
        "/api/login/",
        { email, password },
        { withCredentials: true } // ensures cookie is sent
      );

      console.log("Login response:", response);

      // refresh user info after login
      await refreshMe();
    },
    [refreshMe]
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
    [user, loading, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
