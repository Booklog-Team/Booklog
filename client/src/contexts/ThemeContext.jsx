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
