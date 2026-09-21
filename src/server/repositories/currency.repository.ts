//src/server/repositories/currency.repository.ts
import "server-only";
import type { Currency as CurrencyRow } from "@prisma/client";
import { prisma, type DbClient } from "@/server/db/client";
import type { CurrencyRecord } from "@/server/domain/types";

const normalizeCode = (value: string) => value.trim().toUpperCase();
const normalizeFlag = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : null;

const DEFAULT_ORDER = [{ displayOrder: "asc" as const }, { code: "asc" as const }];

function toRecord(row: CurrencyRow): CurrencyRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    flagCode: row.flagCode,
    buyRate: row.buyRate.toNumber(),
    sellRate: row.sellRate.toNumber(),
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    ratesUpdatedAt: row.ratesUpdatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listAll(db: DbClient = prisma): Promise<CurrencyRecord[]> {
  const rows = await db.currency.findMany({ orderBy: DEFAULT_ORDER });
  return rows.map(toRecord);
}

export async function listActive(db: DbClient = prisma): Promise<CurrencyRecord[]> {
  const rows = await db.currency.findMany({
    where: { isActive: true },
    orderBy: DEFAULT_ORDER,
  });
  return rows.map(toRecord);
}

export async function findById(
  id: string,
  db: DbClient = prisma,
): Promise<CurrencyRecord | null> {
  const row = await db.currency.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function findByCode(
  code: string,
  db: DbClient = prisma,
): Promise<CurrencyRecord | null> {
  const row = await db.currency.findUnique({ where: { code: normalizeCode(code) } });
  return row ? toRecord(row) : null;
}

export async function nextDisplayOrder(db: DbClient = prisma): Promise<number> {
  const result = await db.currency.aggregate({ _max: { displayOrder: true } });
  return (result._max.displayOrder ?? 0) + 1;
}

export async function create(
  input: {
    code: string;
    name: string;
    symbol?: string | null;
    flagCode?: string | null;
    buyRate: number;
    sellRate: number;
    displayOrder?: number;
    isActive?: boolean;
  },
  db: DbClient = prisma,
): Promise<CurrencyRecord> {
  const row = await db.currency.create({
    data: {
      code: normalizeCode(input.code),
      name: input.name.trim(),
      symbol: input.symbol?.trim() || null,
      flagCode: normalizeFlag(input.flagCode),
      buyRate: input.buyRate,
      sellRate: input.sellRate,
      displayOrder: input.displayOrder ?? (await nextDisplayOrder(db)),
      isActive: input.isActive ?? true,
    },
  });
  return toRecord(row);
}

/** Datos descriptivos. Las tasas se cambian con updateRates. */
export async function updateDetails(
  id: string,
  data: {
    code?: string;
    name?: string;
    symbol?: string | null;
    flagCode?: string | null;
  },
  db: DbClient = prisma,
): Promise<CurrencyRecord> {
  const row = await db.currency.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: normalizeCode(data.code) }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.symbol !== undefined && { symbol: data.symbol?.trim() || null }),
      ...(data.flagCode !== undefined && { flagCode: normalizeFlag(data.flagCode) }),
    },
  });
  return toRecord(row);
}

export async function setActive(
  id: string,
  isActive: boolean,
  db: DbClient = prisma,
): Promise<CurrencyRecord> {
  const row = await db.currency.update({ where: { id }, data: { isActive } });
  return toRecord(row);
}

export async function updateRates(
  id: string,
  buyRate: number,
  sellRate: number,
  db: DbClient = prisma,
): Promise<CurrencyRecord> {
  const row = await db.currency.update({
    where: { id },
    data: { buyRate, sellRate, ratesUpdatedAt: new Date() },
  });
  return toRecord(row);
}

/** Recibe los IDs en el orden final deseado. */
export async function reorder(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.currency.update({ where: { id }, data: { displayOrder: index + 1 } }),
    ),
  );
}
/**
 * Cambia las tasas solo si nadie las modificó desde que se cargó la pantalla.
 * Devuelve false si la versión ya no coincide (conflicto).
 */
export async function updateRatesIfUnchanged(
  id: string,
  expectedUpdatedAt: Date,
  buyRate: number,
  sellRate: number,
  db: DbClient = prisma,
): Promise<boolean> {
  const result = await db.currency.updateMany({
    where: { id, ratesUpdatedAt: expectedUpdatedAt },
    data: { buyRate, sellRate, ratesUpdatedAt: new Date() },
  });
  return result.count === 1;
}