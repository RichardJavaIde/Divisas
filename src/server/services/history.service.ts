//src/server/services/history.service.ts
import "server-only";
import { HISTORY_PAGE_SIZE, HISTORY_PERIODS, type HistoryPeriod } from "@/lib/history";
import { rateHistoryRepository } from "@/server/repositories";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getHistory(query: {
  currencyId?: string;
  period: HistoryPeriod;
  page: number;
}) {
  const days = HISTORY_PERIODS.find((p) => p.value === query.period)?.days ?? null;
  const base = {
    currencyId: query.currencyId,
    since: days ? new Date(Date.now() - days * DAY_MS) : undefined,
    pageSize: HISTORY_PAGE_SIZE,
  };

  let result = await rateHistoryRepository.list({ ...base, page: query.page });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  // Si piden una página que ya no existe (por ejemplo tras filtrar), se muestra la última
  if (query.page > totalPages) {
    result = await rateHistoryRepository.list({ ...base, page: totalPages });
  }

  return { ...result, totalPages };
}