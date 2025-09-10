"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/app/providers";
import { texts } from "@/app/texts";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  // ให้พฤติกรรม mounted เหมือน ThemeToggle ที่คุณใช้
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleToggle = () => {
    console.log("Current lang:", lang);
    const next = lang === "th" ? "en" : "th";
    setLang(next);
    console.log("Language toggled to:", next);
  };

  // ไม่แสดงอะไรจนกว่า component จะ mounted (โชว์ skeleton แทน)
  if (!mounted) {
    return (
      <div className="fixed top-20 right-4 z-50">
        <button
          className="p-3 rounded-full bg-gray-200 shadow-lg transition-all duration-200 border border-gray-300"
          disabled
        >
          <div className="w-5 h-5 bg-gray-400 rounded animate-pulse" />
        </button>
        <div className="mt-2 h-3 w-10 bg-gray-300 rounded mx-auto animate-pulse" />
      </div>
    );
  }

  const getLangName = () => (lang === "th" ? "ไทย" : "English");
  const getButtonText = () =>
    lang === "th" ? texts.th.LanguageSwitcher.english : texts.en.LanguageSwitcher.thai;
  // ไอคอนเดียว (เหมือน ThemeToggle ใช้สลับไอคอนได้) — ที่นี่ใช้ Languages ตายตัว
  const getIcon = () => <Languages className="w-5 h-5" />;

  return (
    // วาง “ต่ำกว่า” ThemeToggle นิดนึง (ThemeToggle = top-4, อันนี้ top-20)
    <div className="fixed top-20 right-4 z-50">
      <button
        onClick={handleToggle}
        className="p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border"
        aria-label={`สลับภาษา (ปัจจุบัน: ${getLangName()})`}
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)"
        }}
        title={getButtonText()}
      >
        {getIcon()}
      </button>
      <div
        className="mt-2 text-xs text-center transition-colors duration-300"
        style={{ color: "var(--muted-foreground)" }}
      >
        {getLangName()}
      </div>
    </div>
  );
}
