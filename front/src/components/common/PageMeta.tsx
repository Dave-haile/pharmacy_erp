import { ToastProvider } from "@/src/hooks/useToast";
import { ConfirmDialogProvider } from "@/src/hooks/useConfirmDialog";
import React from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "@/src/auth/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <ConfirmDialogProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <HelmetProvider>{children}</HelmetProvider>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ConfirmDialogProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default PageMeta;
