import { ToastProvider } from "@/src/hooks/useToast";
import React from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "@/src/auth/AuthContext";
import { BrowserRouter } from "react-router-dom";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Helmet>
    <title>{title + " - Pharmacy ERP"}</title>
    <meta name="description" content={description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <HelmetProvider>{children}</HelmetProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </ToastProvider>
);

export default PageMeta;
