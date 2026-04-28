import "dotenv/config"; // 이 한 줄이면 끝입니다!
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const axios = require("axios");
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

// 2. 알라딘 API 프록시 수정
app.get("/api/aladin", async (req, res) => {
  try {
    // 1. 클라이언트가 보낸 쿼리 파라미터를 그대로 복사
    const params = req.query;

    // 2. 서버에서 직접 알라딘에 요청 (브라우저가 아님!)
    const response = await axios.get("https://www.aladin.co.kr/ItemList.aspx", {
      params: params,
    });

    // 3. 받은 데이터를 클라이언트에게 그대로 전달
    res.json(response.data);
  } catch (error) {
    console.error("Aladin API 호출 중 오류:", error.message);
    res.status(500).json({ error: "데이터를 가져오는데 실패했습니다." });
  }
});

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
