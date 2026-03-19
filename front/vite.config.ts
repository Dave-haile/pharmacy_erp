import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const VITE_API_BASE_URL = env.VITE_API_BASE_URL || "http://localhost:8000";
  return {
    server: {
      port: 5173,
      strictPort: false,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          credentials: true,
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                const newCookies = cookies.map((cookie) => {
                  // Remove domain and secure attributes for development
                  return cookie
                    .replace(/; domain=localhost/i, "")
                    .replace(/; secure/i, "")
                    .replace(/; SameSite=Lax/i, "; SameSite=Lax");
                });
                proxyRes.headers["set-cookie"] = newCookies;
              }
            });
          },
        },
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
