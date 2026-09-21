//src/lib/format.ts
import { siteConfig } from "@/config/site";

/** Tasa con 2 a 4 decimales (las monedas de poco valor necesitan más). */
export function formatRate(value: number): string {
  return new Intl.NumberFormat(siteConfig.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "hace 5 minutos", "ayer", "ahora"… */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffSeconds = Math.trunc((date.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(siteConfig.locale, { numeric: "auto" });

  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.trunc(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(0, "second");
}
/** "+12,5 %" → se muestra como "+12,5%". */
export function formatPercentChange(value: number): string {
  const formatted = new Intl.NumberFormat(siteConfig.locale, {
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value);
  return `${formatted}%`;
}