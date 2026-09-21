//
export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_PERIODS = [
  { value: "all", label: "Todo el historial", days: null },
  { value: "24h", label: "Últimas 24 horas", days: 1 },
  { value: "7d", label: "Últimos 7 días", days: 7 },
  { value: "30d", label: "Últimos 30 días", days: 30 },
] as const;

export type HistoryPeriod = (typeof HISTORY_PERIODS)[number]["value"];