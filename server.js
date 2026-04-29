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

// 3. Groq API 프록시
app.post("/api/groq/chat/completions", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Groq error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Groq API 오류" });
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
