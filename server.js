import "dotenv/config"; // 이 한 줄이면 끝입니다!
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. 도서관 API 프록시
app.use(
  "/api/library",
  createProxyMiddleware({
    target: "https://data4library.kr",
    changeOrigin: true,
    pathRewrite: { "^/api/library": "" },
  })
);

// 2. 알라딘 API 프록시
app.use("/api/aladin", async (req, res) => {
  try {
    const targetPath = req.path;
    const queryString = new URLSearchParams(req.query).toString();
    const url = `https://www.aladin.co.kr/ttb/api${targetPath}?${queryString}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      responseType: "text",
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.send(response.data);
  } catch (error) {
    console.error("Aladin proxy error:", error.message);
    res.status(500).json({ error: "알라딘 API 오류" });
  }
});

// 3. Groq API 프록시 — http-proxy-middleware 대신 직접 fetch 사용
// (Express 5 + proxy-middleware 조합의 POST body 미전달 / 504 타임아웃 문제 회피)
app.post("/api/groq/chat/completions", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not configured" });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    clearTimeout(timer);
    const status = e.name === "AbortError" ? 504 : 500;
    res.status(status).json({ error: e.message });
  }
});

// 정적 파일 서빙 (빌드된 결과물)
app.use(express.static(path.join(__dirname, "dist/public")));

// SPA 라우팅 (모든 요청을 index.html로 보냄)
// 문자열 "(.*)" 대신 정규표현식 객체 /.*/ 를 사용하세요.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist/public/index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
