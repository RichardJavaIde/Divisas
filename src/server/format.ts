//src/server/format.ts
import "server-only";
import { formatDateTime } from "@/lib/format";

/** Si APP_TIMEZONE es inválida, se ignora en lugar de romper las páginas. */
function resolveTimeZone(): string | undefined {
  const value = process.env.APP_TIMEZONE?.trim();
  if (!value) return undefined;
  try {
    new Intl.DateTimeFormat("es", { timeZone: value });
    return value;
  } catch {
    console.warn(`APP_TIMEZONE inválida: "${value}". Se usa la zona del servidor.`);
    return undefined;
  }
}

const TIME_ZONE = resolveTimeZone();

export function formatAppDateTime(date: Date): string {
  return formatDateTime(date, TIME_ZONE);
}