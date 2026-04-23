// ── 알라딘 Open API 연동 ────────────────────────────────────────────────────
// 개발: Vite proxy → /api/aladin/* → http://www.aladin.co.kr/ttb/api/*
// 프로덕션: Express proxy 라우트 처리
const ALADIN_API_KEY = import.meta.env.VITE_ALADIN_API_KEY;
const PROXY_BASE = "/api/aladin";

// ── 알라딘 카테고리 ID 매핑 ─────────────────────────────────────────────────
// 인기 장르 버튼에 표시됨 (Search 화면 grid)
// 아래 목록은 ItemList.aspx Bestseller/ItemNewAll 호출 정상 확인된 ID만 포함
export const GENRE_MAP = {
  소설:      { id: 1,     label: "소설/시/희곡",  queryType: "Bestseller" },
  에세이:    { id: 55890, label: "에세이",         queryType: "Bestseller" },
  자기계발:  { id: 336,   label: "자기계발",       queryType: "Bestseller" },
  인문학:    { id: 656,   label: "인문학",         queryType: "Bestseller" },
  "경제 / 경영":  { id: 170,   label: "경제/경영",      queryType: "Bestseller" },
  역사:      { id: 74,    label: "역사/문화",      queryType: "Bestseller" },
  과학:      { id: 987,   label: "과학",           queryType: "Bestseller" },
  "IT / 컴퓨터":        { id: 351,   label: "IT/컴퓨터",      queryType: "Bestseller" },
  어린이:    { id: 1108,  label: "어린이",         queryType: "Bestseller" },
  청소년:    { id: 1137,  label: "청소년",         queryType: "Bestseller" },
  요리:    { id: 1230,  label: "요리/음식",      queryType: "Bestseller" },
  여행:    { id: 1196,  label: "여행",             queryType: "Bestseller" },
  "예술 / 대중문화":    { id: 517,  label: "예술/대중문화",         queryType: "Bestseller" },
  만화:    { id: 2551,  label: "만화",         queryType: "Bestseller" },
  신간:      { id: null,  label: "전체 신간",      queryType: "ItemNewAll"  },
};

// ── 알라딘 데이터 → 내부 포맷 정규화 ──────────────────────────────────────
// author: "한강 (지은이), 김철수 (번역)" → ["한강", "김철수"]
function parseAuthors(authorStr = "") {
  return authorStr
    .split(",")
    .map((s) => s.replace(/\s*\([^)]*\)/g, "").trim())
    .filter(Boolean);
}

// categoryName: "국내도서>소설/시/희곡>한국소설" → "한국소설"
function parseCategory(categoryName = "") {
  const parts = categoryName.split(">");
  return parts[parts.length - 1]?.trim() || categoryName;
}

function upgradeCoverUrl(url) {
  if (!url) return null;
  return url.replace("/coversum/", "/cover200/").replace("/covermid/", "/cover200/");
}

export function normalizeBook(item) {
  if (!item) return null;
  return {
    id: String(item.itemId),
    _cover: upgradeCoverUrl(item.cover),
    _link: item.link || null,
    _price: item.priceSales || 0,
    _rating: item.customerReviewRank || 0,
    _previewImages: item.subInfo?.previewImgList?.map((p) => p.url || p).filter(Boolean) || [],
    volumeInfo: {
      title: item.title || "제목 없음",
      authors: parseAuthors(item.author),
      publisher: item.publisher || "",
      publishedDate: item.pubDate || "",
      description: item.description || "",
      pageCount: item.subInfo?.itemPage || null,
      categories: item.categoryName ? [parseCategory(item.categoryName)] : [],
      imageLinks: item.cover ? { thumbnail: item.cover } : null,
    },
  };
}

// ── 커버 이미지 ───────────────────────────────────────────────────────────
export const getCoverUrl = () => null; // 호환성 유지용

// 상세 페이지용: cover200 → coverBig (최고화질)
export const getHighQualityCover = (url) => {
  if (!url) return null;
  return url
    .replace("/coversum/", "/coverBig/")
    .replace("/covermid/", "/coverBig/")
    .replace("/cover200/", "/coverBig/");
};

// ── 캐시 ──────────────────────────────────────────────────────────────────
// 'bkla_' prefix: 알라딘 전환 시 구 Google Books 캐시(bkl_)와 격리
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const P = "bkla_"; // localStorage 캐시 prefix
const MEM = new Map();

// 앱 최초 실행 시 이전 prefix(bkl_) 캐시 일괄 삭제
(function cleanLegacyCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bkl_") && !k.startsWith("bkla_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* 무시 */ }
})();

const readCache = (key) => {
  if (MEM.has(key)) return MEM.get(key);
  try {
    const raw = localStorage.getItem(`${P}${key}`);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL) { localStorage.removeItem(`${P}${key}`); return null; }
    MEM.set(key, v);
    return v;
  } catch { return null; }
};

const writeCache = (key, value) => {
  MEM.set(key, value);
  try {
    localStorage.setItem(`${P}${key}`, JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    try {
      const old = Object.keys(localStorage).filter((k) => k.startsWith(P));
      if (old.length) localStorage.removeItem(old[0]);
      localStorage.setItem(`${P}${key}`, JSON.stringify({ v: value, t: Date.now() }));
    } catch { /* 무시 */ }
  }
};

// ── In-flight 중복 제거 ───────────────────────────────────────────────────
const IN_FLIGHT = new Map();

function deduplicate(key, fn) {
  const cached = readCache(key);
  if (cached !== null) return Promise.resolve(cached);
  if (IN_FLIGHT.has(key)) return IN_FLIGHT.get(key);

  const p = fn()
    .then((r) => { writeCache(key, r); IN_FLIGHT.delete(key); return r; })
    .catch((e) => { IN_FLIGHT.delete(key); throw e; });

  IN_FLIGHT.set(key, p);
  return p;
}

// ── HTTP 요청 ─────────────────────────────────────────────────────────────
async function apiFetch(path, params = {}) {
  const url = new URL(path, window.location.origin);
  if (ALADIN_API_KEY) url.searchParams.set("ttbkey", ALADIN_API_KEY);
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(url.toString(), { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("요청 시간이 초과되었습니다.");
    throw new Error("네트워크 오류가 발생했습니다.");
  }
  clearTimeout(timer);

  if (res.status === 503) throw new Error("서버가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.");
  if (res.status === 429) throw new Error("API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.errorCode) throw new Error(`알라딘 API 오류 (${data.errorCode}): ${data.errorMessage}`);
  return data;
}

// ── 공개 API ─────────────────────────────────────────────────────────────

/**
 * 도서 검색 (키워드)
 * @param {string} query
 * @param {{ start?: number }} options   (start는 1부터 시작하는 페이지 번호)
 * @returns {Promise<{ items: Array, totalResults: number, nextStart: number | null }>}
 */
export const searchBooks = (query, options = {}) => {
  if (!query?.trim()) return Promise.resolve({ items: [], totalResults: 0, nextStart: null });
  const { start = 1 } = options;
  const key = `search|${query}|${start}`;

  return deduplicate(key, async () => {
    const data = await apiFetch(`${PROXY_BASE}/ItemSearch.aspx`, {
      Query: query,
      QueryType: "Keyword",
      MaxResults: 20,
      start,
      SearchTarget: "Book",
    });

    const items = (data.item || []).map(normalizeBook);
    const totalResults = data.totalResults || 0;
    const nextStart = start * 20 < totalResults ? start + 1 : null;

    return { items, totalResults, nextStart };
  });
};

/**
 * 카테고리/장르별 도서 목록
<<<<<<< HEAD
 * @param {string} genre   GENRE_MAP 키 (e.g. "소설", "IT")
 * @param {number} maxResults
 * @param {number} start   1-based page number
 * @returns {Promise<{ items: Array, totalResults: number }>}
 */
export const getBooksByGenre = (genre, maxResults = 10, start = 1) => {
  const info = GENRE_MAP[genre];
  if (!info) return Promise.resolve({ items: [], totalResults: 0 });
  const key = `genre|${genre}|${maxResults}|${start}`;

  return deduplicate(key, async () => {
    const params = {
      QueryType: info.queryType,
      MaxResults: maxResults,
      start,
      SearchTarget: "Book",
    };
    if (info.id) params.CategoryId = info.id;

    const data = await apiFetch(`${PROXY_BASE}/ItemList.aspx`, params);
    const items = (data.item || []).map(normalizeBook);
    const totalResults = data.totalResults || items.length;
    return { items, totalResults };
  });
};

/**
 * 도서 상세 정보
 * @param {string|number} itemId   알라딘 itemId
 * @returns {Promise<Object>}   normalizeBook 형태 + pageCount 포함
 */
export const getBookDetail = (itemId) => {
  const key = `detail|${itemId}`;

  return deduplicate(key, async () => {
    const data = await apiFetch(`${PROXY_BASE}/ItemLookUp.aspx`, {
      itemIdType: "ItemId",
      ItemId: itemId,
      OptResult: "subInfo,previewImgList",
    });

    const item = data.item?.[0];
    if (!item) throw new Error("도서 정보를 찾을 수 없습니다.");
    return normalizeBook(item);
  });
};
