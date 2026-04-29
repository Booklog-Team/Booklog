import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      // 개발 서버에서 /api/weather 요청을 처리하는 미들웨어
      // 프로덕션에서는 server.js가 동일한 역할 수행
      {
        name: "dev-weather-proxy",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/api/weather")) return next();
            const url = new URL(req.url, "http://localhost");
            const lat = url.searchParams.get("lat");
            const lon = url.searchParams.get("lon");
            const key = env.VITE_WEATHER_API_KEY;
            if (!key) { res.writeHead(500); res.end(JSON.stringify({ error: "no key" })); return; }
            try {
              const [geoRes, wRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`),
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=kr`),
              ]);
              const [geo, weather] = await Promise.all([geoRes.json(), wRes.json()]);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ geo, weather }));
            } catch (e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        },
      },
    ],
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
      proxy: {
        "/api/library": {
          target: "https://data4library.kr",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/library/, ""),
        },
        "/api/aladin": {
          target: "http://www.aladin.co.kr",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/aladin/, "/ttb/api"),
        },
        // Groq AI 프록시 — API 키는 Vite 서버(Node.js)가 주입, 브라우저에 노출 안 됨
        "/api/groq": {
          target: "https://api.groq.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/groq/, "/openai/v1"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Authorization", `Bearer ${env.GROQ_API_KEY || ""}`);
            });
          },
        },
      },
    },
  };
});
