import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "./MainLayout";
import { useAuth } from "@/src/auth/AuthContext";
import ErrorPage from "@/src/components/ErrorPage";

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = ["/login", "/403", "/404", "/"];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading, authCheckError, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isItemDetailsRoute = /^\/inventory\/medicines\/[^/]+$/.test(
    location.pathname,
  );

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // Only redirect if not on login already
    if (
      !user &&
      !authCheckError &&
      !isPublic &&
      location.pathname !== "/login"
    ) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, authCheckError, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (authCheckError) {
    return (
      <ErrorPage
        title="Unable to verify your session"
        message={authCheckError}
        onRetry={() => {
          void refreshMe();
        }}
      />
    );
  }

  if (!user) {
    return null;
  }

  return <MainLayout fullWidth={isItemDetailsRoute}>{children}</MainLayout>;
}
