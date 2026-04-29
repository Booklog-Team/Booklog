import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALADIN_API_KEY = process.env.ALADIN_API_KEY;
const ALADIN_BASE = "http://www.aladin.co.kr/ttb/api";

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ── 알라딘 API 프록시 (catch-all) ─────────────────────────────────────────
  app.get("/api/aladin/:endpoint", async (req, res) => {
    try {
      const { endpoint } = req.params;
      const url = new URL(`${ALADIN_BASE}/${endpoint}`);
      url.searchParams.set("ttbkey", ALADIN_API_KEY);
      for (const [k, v] of Object.entries(req.query)) {
        url.searchParams.set(k, v);
      }
      const upstream = await fetch(url.toString());
      if (!upstream.ok) throw new Error(`Aladin upstream error: ${upstream.status}`);
      const data = await upstream.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Groq AI 프록시 ───────────────────────────────────────────
  app.post("/api/groq/chat/completions", async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not configured" });
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) res.set('retry-after', retryAfter);
      res.status(response.status).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── 날씨 API 프록시 ──────────────────────────────────────────────
  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    const key = process.env.VITE_WEATHER_API_KEY;
    if (!key) return res.status(500).json({ error: "WEATHER_API_KEY not configured" });
    try {
      const [geoRes, weatherRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=kr`),
      ]);
      const [geo, weather] = await Promise.all([geoRes.json(), weatherRes.json()]);
      res.json({ geo, weather });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── 정적 파일 서빙 ─────────────────────────────────────────────
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const server = createServer(app);
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
