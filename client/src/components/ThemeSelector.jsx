import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
        title="테마 변경"
      >
        <Palette size={16} strokeWidth={1.8} className="flex-shrink-0" />
        <span>테마</span>
        <span className="ml-auto text-[10px] font-medium text-primary truncate">
          {themes.find(t => t.id === theme)?.label}
        </span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* panel */}
          <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-3 animate-fade-in-up">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2.5">
              테마 선택
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={`relative flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all duration-150 text-left ${
                    theme === t.id
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-border/60 hover:border-primary/40 hover:bg-secondary/60"
                  }`}
                >
                  {/* color swatches */}
                  <div className="flex gap-1 items-center">
                    {t.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-black/8"
                        style={{
                          width: i === 0 ? 20 : 14,
                          height: i === 0 ? 20 : 14,
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    {theme === t.id && (
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="ml-auto text-primary flex-shrink-0"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground leading-tight">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
