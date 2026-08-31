import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Dictionary, Direction, Locale } from "./types";
import { STORAGE_KEY } from "./types";
import { fa } from "./fa";
import { en } from "./en";

const DICTS: Record<Locale, Dictionary> = { fa, en };

function getInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "fa" || stored === "en") return stored;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back below
  }
  return "fa";
}

interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const dir: Direction = locale === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore write failures
    }
  }, [locale, dir]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, t: DICTS[locale], setLocale }),
    [locale, dir],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
