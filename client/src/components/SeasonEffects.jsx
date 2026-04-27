import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Gift, Snowflake, Star, Sparkles, Leaf, Sun, Waves, Flower2 } from "lucide-react";

/**
 * SeasonEffects — 배경 없는 깨끗한 아이콘과 애니메이션을 활용한 시즌 효과
 */
export default function SeasonEffects() {
  const { theme } = useTheme();

  // 각 계절별 투명 파티클 생성
  const effects = useMemo(() => {
    const items = [];
    
    if (theme === "spring") {
      for (let i = 0; i < 18; i++) {
        items.push({
          id: `spring-${i}`,
          type: "petal",
          x: Math.random() * 100,
          y: -10,
          size: Math.random() * 8 + 8,
          duration: Math.random() * 5 + 5,
          delay: Math.random() * 10,
        });
      }
    } else if (theme === "summer") {
      for (let i = 0; i < 20; i++) {
        items.push({
          id: `summer-${i}`,
          type: "bubble",
          x: Math.random() * 100,
          y: 110,
          size: Math.random() * 12 + 4,
          duration: Math.random() * 4 + 4,
          delay: Math.random() * 8,
        });
      }
    } else if (theme === "autumn") {
      for (let i = 0; i < 15; i++) {
        items.push({
          id: `autumn-${i}`,
          type: "leaf",
          x: Math.random() * 100,
          y: -10,
          size: Math.random() * 15 + 10,
          duration: Math.random() * 6 + 6,
          delay: Math.random() * 12,
          rotate: Math.random() * 360,
        });
      }
    } else if (theme === "winter") {
      // 산타 대신 선물(Gift), 눈송이(Snowflake), 반짝이(Sparkles) 사용
      const icons = [Gift, Snowflake, Star, Sparkles];
      for (let i = 0; i < 25; i++) {
        items.push({
          id: `winter-${i}`,
          type: "xmas",
          icon: icons[i % icons.length],
          x: Math.random() * 100,
          y: -10,
          size: Math.random() * 15 + 15,
          duration: Math.random() * 8 + 5,
          delay: Math.random() * 15,
          color: i % 3 === 0 ? "text-red-500" : i % 3 === 1 ? "text-emerald-500" : "text-amber-400",
        });
      }
    }
    return items;
  }, [theme]);

  return (
    // z-index를 낮추어 버튼 클릭을 방해하지 않도록 설정 (콘텐츠 뒤로 배치하려면 z-0, 앞으로는 z-10)
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <AnimatePresence>
        {/* 🌊 여름: 파도 애니메이션 (하단 고정) */}
        {theme === "summer" && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 w-full h-32 opacity-30"
          >
            <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path
                fill="var(--primary)"
                d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320L0,320Z"
              >
                <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,192...;M0,160...;M0,192..." />
              </path>
            </svg>
          </motion.div>
        )}

        {/* 🎄 겨울: 전선 및 전구 (상단 고정 - 정교한 버전 복구) */}
        {theme === "winter" && (
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="absolute top-0 left-0 w-full z-10"
          >
            <svg className="w-full h-24 overflow-visible" preserveAspectRatio="none">
              {/* 전선 (Wire) */}
              <path
                d="M0,10 Q100,60 200,10 T400,10 T600,10 T800,10 T1000,10 T1200,10 T1440,10"
                fill="none"
                stroke="#2C3E50"
                strokeWidth="1.5"
                className="opacity-70"
              />
              {/* 전구 소켓 & 전구 */}
              {[...Array(15)].map((_, i) => {
                const x = (i * 100) + 30;
                const y = 10 + (i % 2 === 1 ? 25 : 5);
                return (
                  <g key={i}>
                    <rect x={x - 2} y={y - 8} width="4" height="8" fill="#444" />
                    <motion.circle
                      cx={x}
                      cy={y + 2}
                      r="6"
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        scale: [0.95, 1.15, 0.95],
                        filter: ["drop-shadow(0 0 2px currentColor)", "drop-shadow(0 0 15px currentColor)", "drop-shadow(0 0 2px currentColor)"]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className={i % 3 === 0 ? "text-red-500 fill-current" : i % 3 === 1 ? "text-emerald-400 fill-current" : "text-amber-300 fill-current"}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.div>
        )}

        {/* 🌸 봄: 흩날리는 꽃 아이콘 (상단 고정 요소) */}
        {theme === "spring" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="absolute top-10 right-10">
            <Flower2 size={120} className="text-pink-400 rotate-12" />
          </motion.div>
        )}

        {/* ☀️ 여름: 태양 아이콘 (상단 고정 요소) */}
        {theme === "summer" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} className="absolute top-10 right-10">
            <Sun size={150} className="text-amber-400 animate-spin-slow" style={{ animationDuration: '20s' }} />
          </motion.div>
        )}

        {/* 🍂 가을: 큰 낙엽 아이콘 (하단 고정 요소) */}
        {theme === "autumn" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute bottom-10 left-10">
            <Leaf size={180} className="text-orange-800 -rotate-45" />
          </motion.div>
        )}

        {/* 계절별 파티클 렌더링 (배경 없는 아이콘) */}
        {effects.map((item) => (
          <motion.div
            key={item.id}
            initial={{ x: `${item.x}vw`, y: `${item.y}vh`, opacity: 0, rotate: item.rotate || 0 }}
            animate={{ 
              y: item.type === "bubble" ? "-10vh" : "110vh",
              x: `${item.x + (Math.random() * 20 - 10)}vw`,
              opacity: [0, 1, 1, 0],
              rotate: item.rotate ? item.rotate + 360 : 0
            }}
            transition={{ duration: item.duration, repeat: Infinity, delay: item.delay, ease: "linear" }}
            className="absolute"
          >
            {item.type === "petal" && (
              <div className="bg-pink-300/60 rounded-full blur-[0.5px]" style={{ width: item.size, height: item.size / 1.5, borderRadius: "100% 20% 100% 20%" }} />
            )}
            {item.type === "bubble" && (
              <div className="border border-white/30 bg-white/10 rounded-full" style={{ width: item.size, height: item.size }} />
            )}
            {item.type === "leaf" && (
              <Leaf size={item.size} className="text-orange-700/40" />
            )}
            {item.type === "xmas" && (
              <item.icon size={item.size} className={`${item.color} opacity-60 drop-shadow-sm`} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
