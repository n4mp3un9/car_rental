"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "th" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// ค่าเริ่มต้น
const LangContext = createContext<LangContextType>({
  lang: "th",
  setLang: () => {}
});

// Provider ครอบทั้งแอป
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

// hook ใช้งานง่าย
export function useLang() {
  return useContext(LangContext);
}
