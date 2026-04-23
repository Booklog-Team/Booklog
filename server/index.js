import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALADIN_API_KEY = process.env.ALADIN_API_KEY;
const ALADIN_BASE = "http://www.aladin.co.kr/ttb/api";

async function aladinFetch(endpoint, params) {
  const url = new URL(`${ALADIN_BASE}/${endpoint}`);
  url.searchParams.set("ttbkey", ALADIN_API_KEY);
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Aladin API error: ${res.status}`);
  return res.json();
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ── 알라딘 API 프록시 ─────────────────────────────────────────
  // 도서 검색
  app.get("/api/aladin/search", async (req, res) => {
    try {
      const { query, start = 1, maxResults = 20 } = req.query;
      if (!query) return res.status(400).json({ error: "query required" });
      const data = await aladinFetch("ItemSearch.aspx", {
        Query: query,
        QueryType: "Keyword",
        MaxResults: maxResults,
        start,
        SearchTarget: "Book",
      });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // 카테고리/베스트셀러 목록
  app.get("/api/aladin/list", async (req, res) => {
    try {
      const { categoryId, queryType = "Bestseller", maxResults = 10 } = req.query;
      const params = { QueryType: queryType, MaxResults: maxResults, SearchTarget: "Book" };
      if (categoryId) params.CategoryId = categoryId;
      const data = await aladinFetch("ItemList.aspx", params);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // 도서 상세
  app.get("/api/aladin/detail", async (req, res) => {
    try {
      const { itemId } = req.query;
      if (!itemId) return res.status(400).json({ error: "itemId required" });
      const data = await aladinFetch("ItemLookUp.aspx", {
        itemIdType: "ItemId",
        ItemId: itemId,
        OptResult: "subInfo,previewImgList",
      });
      res.json(data);
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
