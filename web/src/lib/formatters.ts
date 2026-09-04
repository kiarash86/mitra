import type { Locale } from "../i18n/types";

const INTL_LOCALE: Record<Locale, string> = { fa: "fa-IR", en: "en-US" };

const dateFmt: Record<Locale, Intl.DateTimeFormat> = {
  fa: new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }),
  en: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }),
};

const shortDateFmt: Record<Locale, Intl.DateTimeFormat> = {
  fa: new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }),
  en: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
};

const timeFmt: Record<Locale, Intl.DateTimeFormat> = {
  fa: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }),
  en: new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }),
};

export function formatDate(dateStr: string, locale: Locale): string {
  return dateFmt[locale].format(new Date(dateStr));
}

export function formatShortDate(dateStr: string, locale: Locale): string {
  return shortDateFmt[locale].format(new Date(dateStr));
}

export function formatTime(dateStr: string, locale: Locale): string {
  return timeFmt[locale].format(new Date(dateStr));
}

const RELATIVE_UNITS = {
  fa: {
    justNow: "همین الان",
    minutes: (n: string) => `${n} دقیقه پیش`,
    hours: (n: string) => `${n} ساعت پیش`,
    days: (n: string) => `${n} روز پیش`,
  },
  en: {
    justNow: "just now",
    minutes: (n: string) => `${n}m ago`,
    hours: (n: string) => `${n}h ago`,
    days: (n: string) => `${n}d ago`,
  },
} as const;

export function formatRelativeTime(dateStr: string, locale: Locale): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const units = RELATIVE_UNITS[locale];

  if (days > 30) return formatDate(dateStr, locale);
  if (days > 0) return units.days(formatNumber(days, locale));
  if (hours > 0) return units.hours(formatNumber(hours, locale));
  if (minutes > 0) return units.minutes(formatNumber(minutes, locale));
  return units.justNow;
}

/** True when the given date is strictly before today (start of day). */
export function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr).getTime() < today.getTime();
}

export function formatNumber(value: number | undefined | null, locale: Locale): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return (0).toLocaleString(INTL_LOCALE[locale]);
  }
  return value.toLocaleString(INTL_LOCALE[locale]);
}