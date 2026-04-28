import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  {
    id: "warm",
    label: "따뜻한 서재",
    desc: "아이보리 & 테라코타",
    swatches: ["#FDFAF6", "#B85C38", "#4A7C59"],
  },
  {
    id: "forest",
    label: "숲속 산책",
    desc: "초록 자연의 신선함",
    swatches: ["#F2F7F2", "#2D6A3F", "#7A9B20"],
  },
  {
    id: "cafe",
    label: "모닝 카페",
    desc: "커피향 감도는 아침",
    swatches: ["#FDF6E8", "#6B3A1A", "#C4880E"],
  },
  {
    id: "night",
    label: "고요한 밤",
    desc: "따뜻한 램프빛 서재",
    swatches: ["#1C150F", "#D4896A", "#B8A060"],
    dark: true,
  },
  {
    id: "ocean",
    label: "오션 뷰",
    desc: "시원한 바다 전망",
    swatches: ["#EEF4FC", "#2265A8", "#2AADAA"],
  },
  {
    id: "midnight",
    label: "미드나잇",
    desc: "깊은 밤하늘",
    swatches: ["#0E1426", "#6185EC", "#3ABDE8"],
    dark: true,
  },
  {
    id: "mono",
    label: "모노크롬",
    desc: "깔끔한 흑백",
    swatches: ["#F9F9F9", "#1A1A1A", "#888888"],
  },
  {
    id: "spring",
    label: "봄의 왈츠 🌸",
    desc: "벚꽃 흩날리는 오후",
    swatches: ["#FFF5F5", "#FF6B6B", "#82CD47"],
  },
  {
    id: "summer",
    label: "여름의 조각 🌊",
    desc: "청량한 파도와 비눗방울",
    swatches: ["#E0F2FE", "#0284C7", "#10B981"],
  },
  {
    id: "autumn",
    label: "가을의 전설 🍂",
    desc: "단풍 물든 노을빛 산책",
    swatches: ["#FEF3C7", "#991B1B", "#78350F"],
  },
  {
    id: "winter",
    label: "크리스마스 🎄",
    desc: "설레는 선물과 반짝이는 밤",
    swatches: ["#0F172A", "#E11D48", "#10B981"],
    dark: true,
  },
  {
    id: "glass",
    label: "유리 (Glass) 💎",
    desc: "투명하고 세련된 글래스모피즘 디자인",
    swatches: ["#E5E7EB", "#007AFF", "#FFFFFF"],
  },
];

const DARK_THEMES = new Set(THEMES.filter(t => t.dark).map(t => t.id));
const STORAGE_KEY = "booklog-theme";

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.find(t => t.id === stored) ? stored : "warm";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (DARK_THEMES.has(theme)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (id) => {
    if (THEMES.find(t => t.id === id)) setThemeState(id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
