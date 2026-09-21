//src/lib/display.ts
export const DEFAULT_REFRESH_SECONDS = 30;
export const MIN_REFRESH_SECONDS = 10;
export const MAX_REFRESH_SECONDS = 3600;

/** Máximo de filas por página. Si hay más monedas, la pantalla rota páginas. */
export const ROWS_PER_PAGE = 12;
export const PAGE_ROTATION_SECONDS = 15;

/** Lo que el servidor entrega a la pantalla, ya formateado. */
export interface DisplayCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  flagCode: string | null;
  buyRate: number;
  sellRate: number;
  buyText: string;
  sellText: string;
}

export interface DisplayData {
  companyName: string;
  logoUrl: string | null;
  footerNote: string | null;
  refreshSeconds: number;
  timeZone: string | null;
  ratesUpdatedText: string | null;
  generatedAt: string; // ISO
  currencies: DisplayCurrency[];
}

export function clampRefreshSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_REFRESH_SECONDS;
  return Math.min(MAX_REFRESH_SECONDS, Math.max(MIN_REFRESH_SECONDS, Math.round(value)));
}

/** Validación mínima: descarta respuestas que no sean de nuestra API (por ejemplo, un portal cautivo). */
export function isDisplayData(value: unknown): value is DisplayData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<DisplayData>;
  return (
    typeof v.companyName === "string" &&
    typeof v.generatedAt === "string" &&
    typeof v.refreshSeconds === "number" &&
    Array.isArray(v.currencies)
  );
}

// ── Cambios entre una consulta y la siguiente ───────

export type Move = -1 | 0 | 1;
export type RateMove = { buy: Move; sell: Move };
export type RateMoves = Record<string, RateMove>;

export function diffRates(previous: DisplayCurrency[], next: DisplayCurrency[]): RateMoves {
  const before = new Map(previous.map((currency) => [currency.id, currency]));
  const moves: RateMoves = {};

  for (const currency of next) {
    const old = before.get(currency.id);
    if (!old) continue;
    const buy = Math.sign(currency.buyRate - old.buyRate) as Move;
    const sell = Math.sign(currency.sellRate - old.sellRate) as Move;
    if (buy !== 0 || sell !== 0) moves[currency.id] = { buy, sell };
  }

  return moves;
}

// ── Páginas ─────────────────────────────────────────

/** Reparte las monedas en páginas equilibradas (13 → 7 + 6, no 12 + 1). */
export function paginate(total: number, maxPerPage = ROWS_PER_PAGE) {
  const pageCount = Math.max(1, Math.ceil(total / maxPerPage));
  const perPage = Math.max(1, Math.ceil(total / pageCount));
  return { pageCount, perPage };
}

// ── Tamaños según la cantidad de filas ──────────────

export interface RowMetrics {
  flag: number;
  code: number;
  name: number;
  rate: number;
}

const BASE_METRICS = [
  { maxRows: 6, flag: 8.5, code: 6.2, name: 2.8, rate: 8.5 },
  { maxRows: 8, flag: 7.5, code: 5.6, name: 2.6, rate: 7.6 },
  { maxRows: 10, flag: 6.5, code: 5.0, name: 2.4, rate: 6.8 },
  { maxRows: 12, flag: 5.5, code: 4.4, name: 2.2, rate: 6.0 },
] as const;

/** Ancho útil de la columna de tasas (en u) y ancho aproximado de un carácter en negrita (en em). */
const RATE_TEXT_WIDTH = 24;
const CHAR_WIDTH = 0.64;

export function getRowMetrics(rows: number, longestRateChars: number): RowMetrics {
  const base = BASE_METRICS.find((metrics) => rows <= metrics.maxRows) ?? BASE_METRICS[3];
  const fit = RATE_TEXT_WIDTH / (Math.max(longestRateChars, 1) * CHAR_WIDTH);
  return { flag: base.flag, code: base.code, name: base.name, rate: Math.min(base.rate, fit) };
}