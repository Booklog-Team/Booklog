import "dotenv/config"; // 이 한 줄이면 끝입니다!
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

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
app.use(
  "/api/aladin",
  createProxyMiddleware({
    target: "http://www.aladin.co.kr",
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: { "^/api/aladin": "/ttb/api" },
    on: {
      proxyRes: (proxyRes) => {
        proxyRes.headers["access-control-allow-origin"] = "*";
      },
    },
  })
);

// 3. Groq API 프록시 (환경변수 적용)
app.use(
  "/api/groq",
  createProxyMiddleware({
    target: "https://api.groq.com",
    changeOrigin: true,
    pathRewrite: { "^/api/groq": "/openai/v1" },
    on: {
      proxyReq: proxyReq => {
        proxyReq.setHeader(
          "Authorization",
          `Bearer ${process.env.GROQ_API_KEY || ""}`
        );
      },
    },
  })
);

// 정적 파일 서빙 (빌드된 결과물)
app.use(express.static(path.join(__dirname, "dist/public")));

// SPA 라우팅 (모든 요청을 index.html로 보냄)
// 문자열 "(.*)" 대신 정규표현식 객체 /.*/ 를 사용하세요.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist/public/index.html"));
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
