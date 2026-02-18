import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get<BackendUser>("/api/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    await api.post(
      "/api/login/",
      { email, password },
      {
        withCredentials: true,
      },
    );
    await refreshMe();
  }, [refreshMe]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}

