import PptxGenJS from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prs = new PptxGenJS();

// ─── Theme ───────────────────────────────────────────────────────────────────
const BG      = "0c111d";
const PRIMARY = "FF4D00";
const WHITE   = "F8FAFC";
const SLATE200 = "E2E8F0";
const SLATE300 = "CBD5E1";
const SLATE400 = "94A3B8";
const SLATE500 = "64748B";
const ROSE    = "FB7185";
const EMERALD = "34D399";
const BLUE400 = "60A5FA";
const FONT    = "Malgun Gothic";

prs.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

// ─── Helpers ─────────────────────────────────────────────────────────────────
const addSlide = () => {
  const s = prs.addSlide();
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: BG }, line: { color: BG },
  });
  // top-left glow
  s.addShape(prs.ShapeType.ellipse, {
    x: -1.5, y: -1.5, w: 5, h: 5,
    fill: { color: PRIMARY, transparency: 88 }, line: { color: BG },
  });
  return s;
};

const header = (s, title) => {
  s.addShape(prs.ShapeType.rect, {
    x: 0.5, y: 0.42, w: 1.2, h: 0.08,
    fill: { color: PRIMARY }, line: { color: PRIMARY },
  });
  s.addShape(prs.ShapeType.rect, {
    x: 1.75, y: 0.42, w: 0.25, h: 0.08,
    fill: { color: PRIMARY, transparency: 60 }, line: { color: BG },
  });
  s.addText(title, {
    x: 0.5, y: 0.52, w: 12.3, h: 0.6,
    fontSize: 24, bold: true, color: WHITE, fontFace: FONT,
  });
};

const card = (s, x, y, w, h, opts = {}) =>
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill || "FFFFFF", transparency: opts.fillTr ?? 93 },
    line: { color: opts.line || "FFFFFF", transparency: opts.lineTr ?? 80, width: 1 },
    rectRadius: opts.r || 0.2,
  });

const dot = (s, x, y) =>
  s.addShape(prs.ShapeType.ellipse, {
    x, y, w: 0.09, h: 0.09,
    fill: { color: PRIMARY }, line: { color: PRIMARY },
  });

const bullets = (s, x, y, w, items, { fs = 13, gap = 0.42, color = SLATE200 } = {}) =>
  items.forEach((t, i) => {
    dot(s, x, y + i * gap + 0.06);
    s.addText(t, {
      x: x + 0.18, y: y + i * gap, w: w - 0.18, h: gap,
      fontSize: fs, color, fontFace: FONT, wrap: true,
    });
  });

const pubPath = path.join(__dirname, "client/public");
const img = (s, src, x, y, w, h) => {
  const abs = path.join(pubPath, src);
  if (fs.existsSync(abs)) {
    s.addImage({ path: abs, x, y, w, h, sizing: { type: "contain", w, h } });
    return true;
  }
  return false;
};

// ─── 01 Cover ────────────────────────────────────────────────────────────────
{
  const s = addSlide();
  s.addShape(prs.ShapeType.roundRect, {
    x: 3.9, y: 0.45, w: 5.5, h: 0.6,
    fill: { color: PRIMARY, transparency: 85 }, line: { color: PRIMARY, transparency: 60 }, rectRadius: 0.3,
  });
  s.addText("📖  나만의 따뜻한 서재", {
    x: 3.9, y: 0.45, w: 5.5, h: 0.6,
    align: "center", fontSize: 16, bold: true, color: PRIMARY, fontFace: FONT,
  });
  s.addText("BOOKLOG", {
    x: 0, y: 1.1, w: "100%", h: 3.0,
    align: "center", fontSize: 96, bold: true, color: WHITE, fontFace: FONT,
  });
  s.addText("기록과 소통으로 연결되는 AI 독서 플랫폼", {
    x: 0, y: 4.3, w: "100%", h: 0.55,
    align: "center", fontSize: 18, color: SLATE400, fontFace: FONT,
  });
  [
    { label: "Team", val: "신민서 · 이예진 · 홍준화", cx: 1.7 },
    { label: "Date", val: "2026. 04. 30",              cx: 5.0 },
    { label: "URL",  val: "booklog.kro.kr",             cx: 8.3 },
  ].forEach(({ label, val, cx }) => {
    s.addText(label.toUpperCase(), {
      x: cx, y: 5.15, w: 2.8, h: 0.3,
      align: "center", fontSize: 9, bold: true, color: SLATE500, fontFace: FONT, charSpacing: 3,
    });
    s.addText(val, {
      x: cx, y: 5.48, w: 2.8, h: 0.4,
      align: "center", fontSize: 14, bold: true, color: SLATE200, fontFace: FONT,
    });
  });
}

// ─── 02 프로젝트 개요 ─────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "프로젝트 개요");
  const rows = [
    { label: "서비스명",  value: "Booklog" },
    { label: "분류",      value: "독서 기록 + AI 추천 + 커뮤니티 웹앱" },
    { label: "타겟",      value: "독서 습관 형성을 원하는 입문자 및 다독가" },
    { label: "핵심 가치", value: "독서 기록화 / 맞춤형 도서 발견 / 독서 가치 확장" },
    { label: "개발 기간", value: "2026. 04. 22 ~ 04. 29" },
    { label: "주요 기능", value: "홈, 검색, 내 서재, 커뮤니티, 독서모임, 포인트, AI 챗봇" },
    { label: "배포 환경", value: "GitHub Actions / Docker / AWS EC2" },
  ];
  rows.forEach((r, i) => {
    const y = 1.28 + i * 0.74;
    card(s, 0.5, y, 12.3, 0.64);
    s.addText(r.label, { x: 0.75, y: y + 0.13, w: 1.7, h: 0.38, fontSize: 11, bold: true, color: SLATE500, fontFace: FONT, charSpacing: 1 });
    s.addText(r.value, { x: 2.65, y: y + 0.13, w: 9.8, h: 0.38, fontSize: 14, bold: true, color: SLATE200, fontFace: FONT });
  });
}

// ─── 03 선정 배경 & 문제 정의 ─────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "선정 배경 & 문제 정의");
  [
    { sub: "EXISTING SERVICE LIMITS", title: "기존 서비스의 한계",
      items: ["도서 정보 / 리뷰 중심", "독서 '과정' 기록 불가", "지속적인 독서 유도 부족"], x: 0.5 },
    { sub: "PROBLEM DEFINITION",       title: "문제 정의 → 출발",
      items: ["독서 경험이 축적되지 않음", "기록 구조 부재", "지속성 부족"], x: 6.9 },
  ].forEach(({ sub, title, items, x }) => {
    card(s, x, 1.28, 6.1, 3.7, { r: 0.3 });
    s.addText(sub, { x: x + 0.3, y: 1.48, w: 5.5, h: 0.3, fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 2 });
    s.addText(title, { x: x + 0.3, y: 1.78, w: 5.5, h: 0.55, fontSize: 20, bold: true, color: WHITE, fontFace: FONT });
    bullets(s, x + 0.3, 2.5, 5.5, items, { fs: 14, gap: 0.5 });
  });
  s.addShape(prs.ShapeType.roundRect, {
    x: 0.5, y: 5.2, w: 12.3, h: 0.88,
    fill: { color: PRIMARY }, line: { color: PRIMARY }, rectRadius: 0.25,
  });
  s.addText("독서를 기록하고 관리할 수 있는 서비스는 없을까?", {
    x: 0.5, y: 5.2, w: 12.3, h: 0.88,
    align: "center", fontSize: 20, bold: true, color: WHITE, fontFace: FONT,
  });
}

// ─── 04 핵심 키워드 ───────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "핵심 키워드 / 서비스");
  const kws = [
    { num: "01", title: "독서 기록화",
      items: ["3단계 상태 관리 (읽는 중 / 완독 / 읽고 싶음)", "진행률 자동 계산 & 완독 축하 애니메이션", "캘린더 스트릭 시각화 및 독서 메모/별점"],
      tag: "사용자의 모든 독서 '과정'을 데이터로 축적하여 습관 형성을 지원합니다." },
    { num: "02", title: "맞춤형 도서 발견",
      items: ["날씨·시간대 기반 실시간 AI 추천 (LLM)", "장르 기반 추천 및 알라딘 API 도서 검색", "주변 도서관 찾기 & 실시간 대출 가능 여부 확인"],
      tag: "상황에 맞는 최적의 도서를 제안하고 실제 대출까지 연결합니다." },
    { num: "03", title: "독서 가치 확장",
      items: ["포인트 기부 시스템 (어린이재단·장애인도서관 등)", "독서 모임 개설·참여 및 실시간 채팅 소통", "커뮤니티 (독후감, 추천, 질문)를 통한 지식 공유"],
      tag: "개인의 독서 활동이 사회적 가치와 커뮤니티로 연결됩니다." },
  ];
  kws.forEach((kw, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.28, 4.0, 5.7, { r: 0.3 });
    s.addText(kw.num, { x: x + 2.5, y: 1.32, w: 1.3, h: 0.7, fontSize: 28, bold: true, color: PRIMARY, fontFace: FONT, transparency: 70 });
    s.addText(kw.title, { x: x + 0.3, y: 1.58, w: 3.5, h: 0.55, fontSize: 18, bold: true, color: WHITE, fontFace: FONT });
    bullets(s, x + 0.3, 2.3, 3.5, kw.items, { fs: 11, gap: 0.48 });
    s.addShape(prs.ShapeType.roundRect, {
      x: x + 0.2, y: 5.7, w: 3.6, h: 1.0,
      fill: { color: PRIMARY }, line: { color: PRIMARY }, rectRadius: 0.18,
    });
    s.addText(`"${kw.tag}"`, {
      x: x + 0.2, y: 5.7, w: 3.6, h: 1.0,
      align: "center", fontSize: 9.5, bold: true, color: WHITE, fontFace: FONT, wrap: true,
    });
  });
}

// ─── 05 타겟 설정 ─────────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "타겟 설정");
  // Heavy
  card(s, 0.5, 1.28, 6.1, 5.7, { r: 0.3 });
  s.addText("MAIN TARGET", { x: 0.8, y: 1.48, w: 3, h: 0.3, fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 2 });
  s.addText("주요 타겟: 헤비 유저 (다독가 / 애독가)", { x: 0.8, y: 1.8, w: 5.5, h: 0.55, fontSize: 16, bold: true, color: WHITE, fontFace: FONT });
  s.addText("이미 독서를 꾸준히 하는 사용자, 기록 / 관리 니즈 존재", { x: 0.8, y: 2.4, w: 5.5, h: 0.4, fontSize: 12, color: SLATE400, fontFace: FONT });
  s.addText("헤비 유저가 원하는 것", { x: 0.8, y: 3.0, w: 3.5, h: 0.3, fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 2 });
  bullets(s, 0.8, 3.4, 5.5, ["언제 읽었는지", "무엇을 읽었는지", "얼마나 읽었는지", "어떤 생각을 했는지"], { fs: 13, gap: 0.45 });
  s.addShape(prs.ShapeType.roundRect, { x: 0.8, y: 5.95, w: 5.5, h: 0.72, fill: { color: PRIMARY }, line: { color: PRIMARY }, rectRadius: 0.2 });
  s.addText('"기록과 관리"', { x: 0.8, y: 5.95, w: 5.5, h: 0.72, align: "center", fontSize: 20, bold: true, color: WHITE, fontFace: FONT });
  // Light
  card(s, 6.8, 1.28, 6.1, 5.7, { r: 0.3 });
  s.addText("EXPANSION", { x: 7.1, y: 1.48, w: 3, h: 0.3, fontSize: 9, bold: true, color: SLATE400, fontFace: FONT, charSpacing: 2 });
  s.addText("라이트 유저 (확장)", { x: 7.1, y: 1.8, w: 5.5, h: 0.55, fontSize: 16, bold: true, color: WHITE, fontFace: FONT });
  s.addText("독서를 꾸준히 하지 못하는 사용자, 습관 형성 필요", { x: 7.1, y: 2.4, w: 5.5, h: 0.4, fontSize: 12, color: SLATE400, fontFace: FONT });
  card(s, 7.1, 3.05, 5.5, 2.3, { r: 0.2 });
  s.addText('"독서를 습관으로 만들 수 있는\n강력한 동기부여와 재미 요소가 필요함"', {
    x: 7.1, y: 3.05, w: 5.5, h: 2.3,
    align: "center", fontSize: 13, bold: true, italic: true, color: SLATE300, fontFace: FONT, wrap: true,
  });
  s.addShape(prs.ShapeType.roundRect, { x: 7.1, y: 5.95, w: 5.5, h: 0.72, fill: { color: "334155" }, line: { color: "334155" }, rectRadius: 0.2 });
  s.addText('"동기부여 제공"', { x: 7.1, y: 5.95, w: 5.5, h: 0.72, align: "center", fontSize: 20, bold: true, color: WHITE, fontFace: FONT });
}

// ─── Persona helper ───────────────────────────────────────────────────────────
const personaSlide = (title, p) => {
  const s = addSlide();
  header(s, title);
  // photo area
  s.addShape(prs.ShapeType.roundRect, { x: 0.5, y: 1.28, w: 3.8, h: 5.7, fill: { color: "1E293B" }, line: { color: "475569" }, rectRadius: 0.3 });
  const loaded = img(s, p.image, 0.5, 1.28, 3.8, 5.7);
  if (!loaded) s.addText(p.name[0], { x: 0.5, y: 1.28, w: 3.8, h: 3.5, align: "center", fontSize: 60, bold: true, color: WHITE, fontFace: FONT });
  s.addShape(prs.ShapeType.roundRect, { x: 0.7, y: 5.6, w: 2.2, h: 0.36, fill: { color: PRIMARY }, line: { color: PRIMARY }, rectRadius: 0.1 });
  s.addText(p.vibe, { x: 0.7, y: 5.6, w: 2.2, h: 0.36, align: "center", fontSize: 9, bold: true, color: WHITE, fontFace: FONT });
  s.addText(p.name, { x: 0.6, y: 5.98, w: 3.6, h: 0.55, fontSize: 26, bold: true, color: WHITE, fontFace: FONT });
  s.addText(`${p.age} · ${p.job}`, { x: 0.6, y: 6.52, w: 3.6, h: 0.35, fontSize: 13, color: SLATE300, fontFace: FONT });
  // profile
  card(s, 4.55, 1.28, 8.2, 3.1, { r: 0.3 });
  s.addText("유저 니즈", { x: 4.85, y: 1.48, w: 3, h: 0.3, fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 2 });
  s.addText(`"${p.profile}"`, { x: 4.85, y: 1.82, w: 7.7, h: 2.22, fontSize: 13, bold: true, italic: true, color: SLATE200, fontFace: FONT, wrap: true });
  // keywords
  let kx = 4.85;
  p.keywords.forEach(kw => {
    const w = Math.max(kw.length * 0.155 + 0.4, 1.4);
    card(s, kx, 4.5, w, 0.35, { r: 0.12 });
    s.addText(`#${kw}`, { x: kx, y: 4.5, w, h: 0.35, align: "center", fontSize: 10, bold: true, color: SLATE400, fontFace: FONT });
    kx += w + 0.15;
  });
  // scenario
  card(s, 4.55, 5.0, 8.2, 2.0, { fill: PRIMARY, fillTr: 87, line: PRIMARY, lineTr: 65, r: 0.3 });
  s.addText("유저 시나리오", { x: 4.85, y: 5.15, w: 3, h: 0.3, fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 2 });
  s.addText(p.scenario, { x: 4.85, y: 5.5, w: 7.7, h: 1.25, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, wrap: true });
};

// ─── 06 페르소나 헤비 ──────────────────────────────────────────────────────────
personaSlide("페르소나 : 헤비 유저 - 기록 분석가 & 토론가", {
  name: "김선유", age: "28세", job: "다독가", vibe: "기록 분석가 & 토론가",
  image: "/persona_d.png",
  profile: "이미 읽은 책이 많아 개인 독서 데이터를 정교하게 관리하고 싶음. 단순 독서를 넘어 깊이 있는 토론과 지식 공유를 위한 커뮤니티 공간과 새로운 미독 도서 발견이 필요함.",
  scenario: "독서 통계 분석 → AI 챗봇에게 미독 도서 추천 요청 → 커뮤니티 독후감 공유 및 모임 참여",
  keywords: ["데이터 시각화", "지식 공유 커뮤니티", "미독 기반 추천"],
});

// ─── 07 페르소나 라이트 ────────────────────────────────────────────────────────
personaSlide("페르소나 : 라이트 유저 - 습관 형성자", {
  name: "박지우", age: "22세", job: "대학생", vibe: "습관 형성자",
  image: "/persona_b.png",
  profile: "독서 습관이 부족해 매번 작심삼일에 그침. 무엇을 읽을지 고민하는 시간이 길어 상황에 맞는 추천과 함께, 독서를 지속할 시각적인 보상이 필요함.",
  scenario: "기분에 맞는 AI 추천 도서 발견 → 매일 읽은 페이지 기록 → 완독 Confetti와 포인트 기부",
  keywords: ["맞춤 도서 발견", "시각적 성취", "독서 습관 형성"],
});

// ─── 08 Tech Stack ────────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "Tech Stack");
  const items = [
    { name: "React + Vite",      desc: "고성능 UI 컴포넌트 개발 및 모던 빌드 시스템",           c: "61DAFB" },
    { name: "Tailwind CSS",      desc: "유틸리티 우선 방식의 고속 스타일링 및 디자인 시스템",    c: "38B2AC" },
    { name: "Firebase Auth",     desc: "Google OAuth를 통한 안전하고 간편한 사용자 인증",        c: "FFA000" },
    { name: "Firestore (NoSQL)", desc: "실시간 데이터 동기화 및 유연한 문서 지향 데이터베이스",  c: "FFCA28" },
    { name: "Jira & Notion",     desc: "체계적인 Task 관리 및 프로젝트 문서화/기록",             c: "0052CC" },
    { name: "GitHub & Slack",    desc: "효율적인 코드 버전 관리 및 실시간 팀 커뮤니케이션",      c: "94A3B8" },
  ];
  items.forEach((it, i) => {
    const x = 0.5 + (i % 2) * 6.4, y = 1.32 + Math.floor(i / 2) * 1.95;
    card(s, x, y, 6.1, 1.7, { r: 0.25 });
    s.addShape(prs.ShapeType.roundRect, { x: x + 0.25, y: y + 0.28, w: 1.1, h: 1.1, fill: { color: it.c, transparency: 80 }, line: { color: it.c, transparency: 75 }, rectRadius: 0.2 });
    s.addText(it.name[0], { x: x + 0.25, y: y + 0.28, w: 1.1, h: 1.1, align: "center", fontSize: 22, bold: true, color: it.c, fontFace: FONT });
    s.addText(it.name, { x: x + 1.5, y: y + 0.28, w: 4.4, h: 0.48, fontSize: 17, bold: true, color: WHITE, fontFace: FONT });
    s.addText(it.desc, { x: x + 1.5, y: y + 0.82, w: 4.4, h: 0.6, fontSize: 11, color: SLATE400, fontFace: FONT, wrap: true });
  });
}

// ─── 09 API 아키텍처 ──────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "API 연동 및 데이터 아키텍처");
  const flow = [
    { from: "환경 인식",   to: "OpenWeatherMap",       result: "실시간 위치/날씨 데이터" },
    { from: "도서 검색",   to: "알라딘 Open API",       result: "70만 종 도서 메타데이터" },
    { from: "지능형 추천", to: "Groq AI (LLaMA 3)",     result: "사용자 맞춤형 도서 큐레이션 및 챗봇" },
    { from: "정보 조회",   to: "도서관정보나루 API",     result: "전국 도서관 대출 현황/보유 정보" },
    { from: "위치 시각화", to: "Google Maps API",        result: "인근 도서관 위치 및 정보 렌더링" },
    { from: "상태 동기화", to: "Firebase Firestore",     result: "사용자 활동 데이터 실시간 저장" },
  ];
  flow.forEach((f, i) => {
    const x = 0.5 + (i % 2) * 6.4, y = 1.32 + Math.floor(i / 2) * 1.9;
    card(s, x, y, 6.1, 1.65, { r: 0.25 });
    s.addShape(prs.ShapeType.roundRect, { x: x + 0.25, y: y + 0.28, w: 0.85, h: 0.85, fill: { color: PRIMARY, transparency: 80 }, line: { color: PRIMARY, transparency: 70 }, rectRadius: 0.15 });
    s.addText(`0${i + 1}`, { x: x + 0.25, y: y + 0.28, w: 0.85, h: 0.85, align: "center", fontSize: 14, bold: true, color: PRIMARY, fontFace: FONT });
    s.addText(`${f.from}  →  ${f.result}`, { x: x + 1.25, y: y + 0.28, w: 4.7, h: 0.35, fontSize: 9, color: SLATE500, fontFace: FONT });
    s.addText(f.to, { x: x + 1.25, y: y + 0.68, w: 4.7, h: 0.6, fontSize: 18, bold: true, color: PRIMARY, fontFace: FONT });
  });
}

// ─── 10 System Architecture ───────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "System Architecture");
  const cicd = path.join(__dirname, "client/public/features/CICD Pipeline for GitHub-2026-04-29-062613.png");
  if (fs.existsSync(cicd)) {
    s.addImage({ path: cicd, x: 0.5, y: 1.25, w: 12.3, h: 5.85, sizing: { type: "contain", w: 12.3, h: 5.85 } });
  } else {
    card(s, 0.5, 1.25, 12.3, 5.85, { r: 0.3 });
    s.addText("[ CI/CD Pipeline Diagram ]", { x: 0.5, y: 1.25, w: 12.3, h: 5.85, align: "center", fontSize: 22, color: SLATE400, fontFace: FONT });
  }
}

// ─── Feature slide helper ─────────────────────────────────────────────────────
const featureSlide = (title, points, images = []) => {
  const s = addSlide();
  const name = title.replace(/^주요 기능:\s*/, "");
  // accent bar
  s.addShape(prs.ShapeType.rect, { x: 0.5, y: 0.42, w: 1.2, h: 0.08, fill: { color: PRIMARY }, line: { color: PRIMARY } });
  s.addText("주요 기능:", { x: 0.5, y: 0.52, w: 5.8, h: 0.4, fontSize: 16, bold: true, color: WHITE, fontFace: FONT });
  s.addText(name,         { x: 0.5, y: 0.92, w: 5.5, h: 0.55, fontSize: 22, bold: true, color: PRIMARY, fontFace: FONT });

  points.forEach((p, i) => {
    const y = 1.72 + i * 0.9;
    s.addShape(prs.ShapeType.roundRect, { x: 0.5, y: y, w: 0.44, h: 0.44, fill: { color: PRIMARY, transparency: 80 }, line: { color: PRIMARY, transparency: 70 }, rectRadius: 0.1 });
    s.addText(`0${i + 1}`, { x: 0.5, y: y, w: 0.44, h: 0.44, align: "center", fontSize: 11, bold: true, color: PRIMARY, fontFace: FONT });
    s.addText(p, { x: 1.08, y: y + 0.02, w: 5.05, h: 0.72, fontSize: 13, bold: true, color: SLATE200, fontFace: FONT, wrap: true });
  });

  // browser mockup
  const ix = 6.3, iy = 0.88, iw = 6.7, ih = 6.52;
  s.addShape(prs.ShapeType.roundRect, { x: ix, y: iy, w: iw, h: ih, fill: { color: "1E293B" }, line: { color: "475569" }, rectRadius: 0.25 });
  s.addShape(prs.ShapeType.rect,      { x: ix, y: iy, w: iw, h: 0.38, fill: { color: "E8DDD0" }, line: { color: "B85C38", transparency: 80 } });
  [0, 0.22, 0.44].forEach((off, ci) => {
    s.addShape(prs.ShapeType.ellipse, { x: ix + 0.2 + off, y: iy + 0.13, w: 0.12, h: 0.12, fill: { color: "B85C38", transparency: [40, 70, 85][ci] }, line: { color: BG } });
  });
  s.addText("booklog.kro.kr", { x: ix + 1.5, y: iy + 0.04, w: iw - 2.5, h: 0.3, align: "center", fontSize: 9, color: "B85C38", fontFace: FONT });

  if (images[0]) {
    const loaded = img(s, images[0], ix + 0.08, iy + 0.42, iw - 0.16, ih - 0.5);
    if (!loaded) s.addText(`[${images[0]}]`, { x: ix + 0.2, y: iy + 0.5, w: iw - 0.4, h: ih - 0.6, align: "center", fontSize: 12, color: SLATE500, fontFace: FONT });
  }
};

// ─── 11–23 주요 기능 ─────────────────────────────────────────────────────────
featureSlide("주요 기능: Auth", [
  "Firebase Auth 기반 이메일 로그인과 Google 소셜 로그인 구현",
  "AuthContext로 로그인 상태 전역 관리",
  "PrivateRoute로 비인증 접근 차단",
], ["/features/auth.png"]);

featureSlide("주요 기능: Onboarding", [
  "최초 로그인 시 관심 장르 선택 플로우",
  "선택 데이터 Firestore에 저장",
  "홈 화면 도서 추천의 기반 데이터로 활용",
], ["/features/onboarding.png"]);

featureSlide("주요 기능: AI 홈 배너 x 날씨 API", [
  "Groq AI가 LLM을 통해 실제 도서 중 테마에 부합하는 책만 선별",
  "AI 환각 방지 — 실제 API 데이터 인덱스 기반 추천",
  "현재 위치의 날씨와 시간대를 분석하여 무드 결정",
  "알라딘 베스트셀러 중 무드에 맞는 카테고리 도서 풀 수집",
], ["/features/home.png"]);

featureSlide("주요 기능: 도서 검색 & 상세", [
  "실시간 키워드 검색 및 14개 장르별 탐색",
  "최근 검색어 표시 및 자동 완성 기능",
  "서재 즉시 추가 및 상태 관리",
  "관련 도서 & 추천 도서",
], ["/features/search.png"]);

featureSlide("주요 기능: 내 주변 도서관", [
  "Geolocation API로 현재 위치 감지",
  "도서관 정보나루 API로 주변 도서관 검색 및 대출가능 여부 확인",
  "Google Maps API로 지도에 마커 시각화",
], ["/features/map.png"]);

featureSlide("주요 기능: 내 서재", [
  "사용자의 도서를 읽고싶음 / 읽는 중 / 완독 상태로 분류하여 관리",
  "도서별 진행률, 현재 페이지, 메모, 마지막 기록일 표시",
  "도서 삭제 및 상태 변경 시 Firestore 데이터와 화면 상태 동기화",
], ["/features/library.png"]);

featureSlide("주요 기능: 독서 기록 & 캘린더", [
  "날짜별 독서 기록을 캘린더 형태로 시각화",
  "독서 상태 변경, 페이지 기록, 메모 작성 내역을 로그로 관리",
  "연속 독서일(streak)을 계산하여 사용자의 독서 흐름을 직관적으로 표시",
], ["/features/calendar.png"]);

featureSlide("주요 기능: 프로필 & 독서 통계", [
  "사용자 정보와 독서 활동 통계를 한 화면에서 확인",
  "완독 권수, 총 읽은 페이지, 연속 독서일 등 핵심 지표 제공",
  "월별 독서량과 장르별 독서 비율을 시각화하여 패턴 분석",
], ["/features/profile.png"]);

featureSlide("주요 기능: 독서 모임", [
  "독서 모임 목록, 상세 정보 조회 및 생성 기능",
  "모임별 책 정보, 모집 인원, 마감일, 읽을 범위 상세 관리",
  "모임장 공지와 감상 공유를 통한 책 중심 커뮤니티",
], ["/features/meeting.png"]);

featureSlide("주요 기능: 자유게시판", [
  "게시글 목록 조회, 상세 보기 및 작성 기능 구현",
  "카테고리 분류, 댓글, 좋아요를 통한 사용자 간 소통 지원",
  "커뮤니티 탭 내에서 모임과 게시판을 통합적으로 탐색",
], ["/features/board.png"]);

featureSlide("주요 기능: AI 챗봇 사서", [
  "자연어 질문을 통한 개인화된 도서 추천",
  "현재 날씨와 상황(비 오는 날 등)을 반영한 대화",
  "사용자 서재 데이터를 분석하여 중복 없는 미독 도서 제안",
  "대화 문맥에서 도서 의도를 파악하여 즉시 카드 출력",
], ["/features/chatbot.png"]);

featureSlide("주요 기능: Points & 기부", [
  "독서 활동으로 포인트 적립 및 레벨 시스템",
  "포인트로 도서 관련 단체에 기부",
  "전체 기부 현황 실시간 Firestore 구독",
], ["/features/points.png"]);

featureSlide("주요 기능: UI 테마 시스템", [
  "다양한 테마 제공으로 사용자 취향에 맞는 UI 환경 구성",
  "테마 변경 시 전체 페이지에 즉시 반영되는 설계",
  "카드 기반 레이아웃과 컬러 조합으로 테마별 분위기 차별화",
  "독서 흐름(상태)이 테마 내에서도 일관되게 표현됨",
], ["/features/theme.png"]);

// ─── 24 시연 영상 ─────────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "시연 영상");
  card(s, 1.5, 1.4, 10.3, 5.4, { fillTr: 88, lineTr: 75, r: 0.4 });
  s.addText("▶", { x: 1.5, y: 2.2, w: 10.3, h: 2.0, align: "center", fontSize: 72, color: WHITE, fontFace: FONT });
  const steps = ["온보딩/로그인", "홈 날씨 추천", "도서 탐색/검색", "서재 기록/캘린더", "포인트 기부", "커뮤니티/채팅", "AI 챗봇"];
  steps.forEach((step, i) => {
    const x = 1.7 + (i % 4) * 2.45, y = 5.15 + Math.floor(i / 4) * 0.7;
    s.addShape(prs.ShapeType.roundRect, { x, y, w: 2.2, h: 0.52, fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", transparency: 78 }, rectRadius: 0.12 });
    s.addText(step, { x, y, w: 2.2, h: 0.52, align: "center", fontSize: 10, bold: true, color: WHITE, fontFace: FONT });
  });
}

// ─── 25 Troubleshooting ───────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "Troubleshooting");
  const items = [
    { prob: "Firebase 서비스 계정 키 GitHub 노출",
      cause: ".gitignore 누락으로 인한 보안 키(serviceAccountKey.json) 공용 저장소 커밋",
      sol: "노출 키 폐기 및 재발급 → .gitignore 차단 → 환경변수를 통한 주입 방식으로 보안 프로세스 개선" },
    { prob: "State와 Event 간 데이터 정합성 불일치",
      cause: "책의 현재 상태와 독서 기록 로그를 중복 관리하여 단일 기준(SSOT) 부재",
      sol: "별도 상태 필드 제거 및 독서 기록 로그를 기준으로 현재 상태를 실시간 계산하는 SSOT 구조로 개편" },
    { prob: "API 호출 한도 제한(429) 및 중복 요청",
      cause: "Groq AI 무료 티어의 엄격한 RPM/TPM 제한 및 여러 컴포넌트에서의 동시 API 호출",
      sol: "전역 직렬화 큐(Serialization Queue) 도입으로 호출 간격 제어 및 In-flight 요청 중복 제거와 로컬 캐싱(1분) 적용" },
  ];
  items.forEach((it, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.28, 4.0, 5.7, { r: 0.3 });
    s.addText("⚠  Problem", { x: x + 0.25, y: 1.48, w: 3.5, h: 0.3, fontSize: 9, bold: true, color: ROSE, fontFace: FONT, charSpacing: 2 });
    s.addText(it.prob, { x: x + 0.25, y: 1.82, w: 3.5, h: 0.9, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, wrap: true });
    s.addShape(prs.ShapeType.roundRect, { x: x + 0.2, y: 2.82, w: 3.6, h: 1.25, fill: { color: "7F1D1D", transparency: 75 }, line: { color: ROSE, transparency: 70 }, rectRadius: 0.15 });
    s.addText(`⚠️ 원인: ${it.cause}`, { x: x + 0.3, y: 2.88, w: 3.4, h: 1.15, fontSize: 10, bold: true, color: ROSE, fontFace: FONT, wrap: true });
    s.addShape(prs.ShapeType.rect, { x: x + 0.2, y: 4.18, w: 3.6, h: 0.02, fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", transparency: 88 } });
    s.addText("⚡  Solution", { x: x + 0.25, y: 4.28, w: 3.5, h: 0.3, fontSize: 9, bold: true, color: EMERALD, fontFace: FONT, charSpacing: 2 });
    s.addText(it.sol, { x: x + 0.25, y: 4.65, w: 3.5, h: 2.1, fontSize: 11, bold: true, color: SLATE200, fontFace: FONT, wrap: true });
  });
}

// ─── 26 역할 분담 ─────────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "역할 분담 (커밋 이력 기준)");
  const members = [
    { name: "이예진", role: "팀장 / 프론트엔드", photo: "/team/yejin.jpg",
      tasks: ["서재(독서 기록) 핵심 기능 구현", "독서 캘린더 및 streak 시각화", "커뮤니티(모임, 게시판) 기능 개발", "전체 UX 흐름 및 UI 디테일 개선"],
      note: "서비스의 핵심 가치(독서 기록 경험) 담당" },
    { name: "신민서", role: "프론트엔드 / DB", photo: "/team/minseo.jpg",
      tasks: ["로그인 / 회원가입 / 온보딩 구현", "Firebase Auth 및 Firestore 설계", "포인트 & 기부 시스템 개발", "목업 데이터 → DB 전환 및 배포(CI/CD)"],
      note: "서비스의 데이터 흐름과 사용자 상태 담당" },
    { name: "홍준화", role: "프론트엔드 / API", photo: "/team/junhwa.jpg",
      tasks: ["메인 페이지, 검색, 도서 상세 구현", "도서 API 연동 및 추천 기능 개발", "메인 배너 및 UI/UX 개선", "AI 추천 및 챗봇 품질 개선"],
      note: "사용자가 서비스를 처음 접하고 탐색하는 흐름 담당" },
  ];
  members.forEach((m, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.28, 4.0, 5.7, { r: 0.3 });
    // photo
    s.addShape(prs.ShapeType.ellipse, { x: x + 1.2, y: 1.45, w: 1.6, h: 1.6, fill: { color: "334155" }, line: { color: "475569" } });
    const photoAbs = path.join(pubPath, m.photo);
    if (fs.existsSync(photoAbs)) {
      s.addImage({ path: photoAbs, x: x + 1.2, y: 1.45, w: 1.6, h: 1.6, rounding: true, sizing: { type: "cover", w: 1.6, h: 1.6 } });
    } else {
      s.addText(m.name[0], { x: x + 1.2, y: 1.45, w: 1.6, h: 1.6, align: "center", fontSize: 32, bold: true, color: WHITE, fontFace: FONT });
    }
    s.addText(m.name, { x: x + 0.25, y: 3.18, w: 3.5, h: 0.5, align: "center", fontSize: 20, bold: true, color: WHITE, fontFace: FONT });
    s.addText(m.role, { x: x + 0.25, y: 3.68, w: 3.5, h: 0.3, align: "center", fontSize: 10, bold: true, color: PRIMARY, fontFace: FONT });
    m.tasks.forEach((t, ti) => {
      s.addText(`• ${t}`, { x: x + 0.3, y: 4.08 + ti * 0.4, w: 3.5, h: 0.38, fontSize: 10, color: SLATE300, fontFace: FONT, wrap: true });
    });
    s.addShape(prs.ShapeType.rect, { x: x + 0.25, y: 6.6, w: 3.5, h: 0.01, fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", transparency: 88 } });
    s.addText(`👉 ${m.note}`, { x: x + 0.25, y: 6.64, w: 3.5, h: 0.38, fontSize: 9.5, bold: true, italic: true, color: PRIMARY, fontFace: FONT, wrap: true });
  });
}

// ─── 27 프로젝트 회고 ─────────────────────────────────────────────────────────
{
  const s = addSlide();
  header(s, "프로젝트 회고 & 배운 점");
  const retro = [
    { name: "신민서", fb: "UI 구현을 넘어 Firestore 데이터 설계, Docker 환경 구성, GitHub Actions를 통한 CI/CD 구축 과정에서 시스템 전체를 조망하는 재미를 느꼈습니다. 단순히 '동작하는 코드'가 아닌 '운영 가능한 서비스'를 만드는 것의 가치를 배웠습니다." },
    { name: "이예진", fb: "사용자 입장에서 이해하기 쉬운 구조를 고민하며 점진적으로 완성도를 높여가는 방식의 중요성을 깨달았습니다. AI(바이브코딩)를 활용할 때도 요구사항을 얼마나 명확하게 전달하느냐에 따라 품질이 결정된다는 점을 실전에서 체득했습니다." },
    { name: "홍준화", fb: "API 연동 시 근본 원인(Rate Limit 등)을 파악하고 직렬화 큐와 캐시 전략으로 해결하며 문제를 깊이 있게 이해하는 법을 배웠습니다. 배포 과정에서 겪은 환경변수 및 서버 아키텍처 이슈들은 실무 역량을 키우는 값진 경험이 되었습니다." },
  ];
  retro.forEach((m, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.28, 4.0, 4.6, { r: 0.3 });
    s.addShape(prs.ShapeType.roundRect, { x: x + 0.3, y: 1.48, w: 0.72, h: 0.72, fill: { color: PRIMARY, transparency: 80 }, line: { color: PRIMARY, transparency: 70 }, rectRadius: 0.15 });
    s.addText("✦", { x: x + 0.3, y: 1.48, w: 0.72, h: 0.72, align: "center", fontSize: 16, color: PRIMARY, fontFace: FONT });
    s.addText(m.name, { x: x + 1.15, y: 1.55, w: 2.7, h: 0.5, fontSize: 18, bold: true, color: WHITE, fontFace: FONT });
    s.addShape(prs.ShapeType.rect, { x: x + 0.3, y: 2.35, w: 3.4, h: 0.02, fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", transparency: 88 } });
    s.addText(m.fb, { x: x + 0.3, y: 2.45, w: 3.5, h: 3.2, fontSize: 11, color: SLATE300, fontFace: FONT, wrap: true });
  });
  // future roadmap
  s.addShape(prs.ShapeType.roundRect, { x: 0.5, y: 6.1, w: 12.3, h: 0.98, fill: { color: "1E3A5F", transparency: 60 }, line: { color: BLUE400, transparency: 65 }, rectRadius: 0.25 });
  s.addText("🚀  Future Roadmap  |  단순 독서 기록을 넘어 AI와 데이터가 결합된 '독서 가치 확장 플랫폼'으로의 성장", {
    x: 0.5, y: 6.1, w: 12.3, h: 0.98,
    align: "center", fontSize: 13, bold: true, color: BLUE400, fontFace: FONT,
  });
}

// ─── 28 Closing ───────────────────────────────────────────────────────────────
{
  const s = addSlide();
  s.addShape(prs.ShapeType.ellipse, { x: 5.57, y: 0.85, w: 1.2, h: 1.2, fill: { color: PRIMARY, transparency: 80 }, line: { color: PRIMARY, transparency: 65 } });
  s.addText("📖", { x: 5.57, y: 0.85, w: 1.2, h: 1.2, align: "center", fontSize: 30, fontFace: FONT });
  s.addText('"기록은 데이터로, 독서는 습관으로"', {
    x: 0, y: 2.3, w: "100%", h: 1.1,
    align: "center", fontSize: 32, bold: true, italic: true, color: WHITE, fontFace: FONT,
  });
  s.addText("당신만의 개인화된 독서 여정, Booklog가 함께합니다.", {
    x: 0, y: 3.65, w: "100%", h: 0.65,
    align: "center", fontSize: 18, color: SLATE400, fontFace: FONT,
  });
  s.addText("감사합니다.", {
    x: 0, y: 5.15, w: "100%", h: 0.95,
    align: "center", fontSize: 30, bold: true, color: WHITE, fontFace: FONT,
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "BOOKLOG_Presentation.pptx");
prs.writeFile({ fileName: outPath })
  .then(() => console.log(`✅ 완료: ${outPath}`))
  .catch(e => { console.error("❌ 오류:", e); process.exit(1); });
