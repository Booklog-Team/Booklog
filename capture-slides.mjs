import puppeteer from "puppeteer";
import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SLIDE_URL  = "http://localhost:3000/presentation";
const OUT_DIR    = path.join(__dirname, "slide_screenshots");
const OUT_PPT    = path.join(__dirname, "BOOKLOG_Presentation_Screenshots.pptx");
const TOTAL_SLIDES = 28; // Presentation.jsx slides 배열 기준

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  defaultViewport: { width: 1440, height: 810, deviceScaleFactor: 2 },
});

const page = await browser.newPage();

console.log("🌐 페이지 열기:", SLIDE_URL);
try {
  await page.goto(SLIDE_URL, { waitUntil: "networkidle0", timeout: 30000 });
} catch {
  await page.goto(SLIDE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
}

// React + 진입 애니메이션 대기
await new Promise(r => setTimeout(r, 5000));

// 페이지 클릭해서 포커스 확보 (좌표 직접 지정)
await page.mouse.click(720, 400);
await new Promise(r => setTimeout(r, 300));

// 첫 슬라이드로 리셋 (ArrowLeft 30번 → 무조건 처음으로)
for (let k = 0; k < 30; k++) {
  await page.keyboard.press("ArrowLeft");
  await new Promise(r => setTimeout(r, 40));
}
await new Promise(r => setTimeout(r, 800));

const screenshots = [];

for (let i = 0; i < TOTAL_SLIDES; i++) {
  // 애니메이션 완료 대기 (framer-motion 트랜지션 0.6s + 여유)
  await new Promise(r => setTimeout(r, 5000));

  const filePath = path.join(OUT_DIR, `slide_${String(i + 1).padStart(2, "0")}.png`);
  await page.screenshot({ path: filePath });
  screenshots.push(filePath);
  process.stdout.write(`  📸 슬라이드 ${i + 1}/${TOTAL_SLIDES} 캡처\r`);

  if (i < TOTAL_SLIDES - 1) {
    await page.keyboard.press("ArrowRight");
  }
}

await browser.close();
console.log(`\n✅ 캡처 완료: ${screenshots.length}장`);

// ─── PPT 생성 ─────────────────────────────────────────────────────────────────
console.log("\n📄 PPT 생성 중...");

const prs = new PptxGenJS();
prs.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

for (const imgPath of screenshots) {
  const s = prs.addSlide();
  s.addImage({
    path: imgPath,
    x: 0, y: 0, w: "100%", h: "100%",
    sizing: { type: "cover", w: 13.33, h: 7.5 },
  });
}

await prs.writeFile({ fileName: OUT_PPT });
console.log(`\n🎉 완료: ${OUT_PPT}`);
console.log(`   슬라이드 수: ${screenshots.length}장`);
