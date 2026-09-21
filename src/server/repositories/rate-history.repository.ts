//src/server/repositories/rate-history.repository.ts
import "server-only";
import type { RateHistory as RateHistoryRow } from "@prisma/client";
import { prisma, type DbClient } from "@/server/db/client";
import type { Paginated, RateHistoryRecord } from "@/server/domain/types";

export interface NewRateHistoryEntry {
  currencyId: string;
  currencyCode: string;
  previousBuyRate: number | null;
  previousSellRate: number | null;
  newBuyRate: number;
  newSellRate: number;
  changedById: string | null;
  changedByName: string;
}

function toRecord(row: RateHistoryRow): RateHistoryRecord {
  return {
    id: row.id,
    currencyId: row.currencyId,
    currencyCode: row.currencyCode,
    previousBuyRate: row.previousBuyRate?.toNumber() ?? null,
    previousSellRate: row.previousSellRate?.toNumber() ?? null,
    newBuyRate: row.newBuyRate.toNumber(),
    newSellRate: row.newSellRate.toNumber(),
    changedAt: row.changedAt,
    changedById: row.changedById,
    changedByName: row.changedByName,
  };
}

export async function create(
  entry: NewRateHistoryEntry,
  db: DbClient = prisma,
): Promise<void> {
  await db.rateHistory.create({ data: entry });
}

export async function list(
  params: { currencyId?: string; page?: number; pageSize?: number } = {},
  db: DbClient = prisma,
): Promise<Paginated<RateHistoryRecord>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const where = params.currencyId ? { currencyId: params.currencyId } : {};

  const [rows, total] = await Promise.all([
    db.rateHistory.findMany({
      where,
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.rateHistory.count({ where }),
  ]);

  return { items: rows.map(toRecord), total, page, pageSize };
}
export async function countSince(
  since: Date,
  db: DbClient = prisma,
): Promise<number> {
  return db.rateHistory.count({ where: { changedAt: { gte: since } } });
}