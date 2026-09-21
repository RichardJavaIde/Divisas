//src/server/services/dashboard.service.ts
import "server-only";
import { currencyRepository, rateHistoryRepository } from "@/server/repositories";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardSummary() {
  const since = new Date(Date.now() - DAY_MS);

  const [currencies, recent, changesLast24h] = await Promise.all([
    currencyRepository.listAll(),
    rateHistoryRepository.list({ pageSize: 6 }),
    rateHistoryRepository.countSince(since),
  ]);

  const activeCurrencies = currencies.filter((c) => c.isActive);

  const lastRatesUpdate = currencies.reduce<Date | null>(
    (latest, c) => (!latest || c.ratesUpdatedAt > latest ? c.ratesUpdatedAt : latest),
    null,
  );

  return {
    activeCurrencies,
    inactiveCount: currencies.length - activeCurrencies.length,
    lastRatesUpdate,
    changesLast24h,
    recentChanges: recent.items,
  };
}