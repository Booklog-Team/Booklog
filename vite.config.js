import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    fs: { strict: false },
    // 개발 환경 프록시: 알라딘 API CORS/HTTP 문제 해결
    proxy: {
      "/api/aladin": {
        target: "http://www.aladin.co.kr",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/aladin/, "/ttb/api"),
      },
      "/api/library": {
        target: "https://data4library.kr",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/library/, ""),
      },
    },
  },
});
