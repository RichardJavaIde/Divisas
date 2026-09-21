//src/server/services/currency.service.ts
import "server-only";
import { withTransaction } from "@/server/db/client";
import type { UserRecord } from "@/server/domain/types";
import { currencyRepository, rateHistoryRepository } from "@/server/repositories";

type CurrencyErrorCode = "DUPLICATE_CODE" | "NOT_FOUND";

const MESSAGES: Record<CurrencyErrorCode, string> = {
  DUPLICATE_CODE: "Ya existe una moneda con este código.",
  NOT_FOUND: "La moneda ya no existe.",
};

export class CurrencyServiceError extends Error {
  readonly code: CurrencyErrorCode;

  constructor(code: CurrencyErrorCode) {
    super(MESSAGES[code]);
    this.name = "CurrencyServiceError";
    this.code = code;
  }
}

export interface CurrencyDetailsInput {
  code: string;
  name: string;
  symbol: string | null;
  flagCode: string | null;
}

export interface NewCurrencyInput extends CurrencyDetailsInput {
  buyRate: number;
  sellRate: number;
  isActive: boolean;
}

export function listCurrencies() {
  return currencyRepository.listAll();
}

export function getCurrency(id: string) {
  return currencyRepository.findById(id);
}

/** Crea la moneda y su "alta inicial" en el historial, todo o nada. */
export async function createCurrency(
  input: NewCurrencyInput,
  actor: Pick<UserRecord, "id" | "name">,
) {
  return withTransaction(async (tx) => {
    if (await currencyRepository.findByCode(input.code, tx)) {
      throw new CurrencyServiceError("DUPLICATE_CODE");
    }

    const created = await currencyRepository.create(input, tx);

    await rateHistoryRepository.create(
      {
        currencyId: created.id,
        currencyCode: created.code,
        previousBuyRate: null,
        previousSellRate: null,
        newBuyRate: created.buyRate,
        newSellRate: created.sellRate,
        changedById: actor.id,
        changedByName: actor.name,
      },
      tx,
    );

    return created;
  });
}

export async function updateCurrencyDetails(id: string, input: CurrencyDetailsInput) {
  return withTransaction(async (tx) => {
    const current = await currencyRepository.findById(id, tx);
    if (!current) throw new CurrencyServiceError("NOT_FOUND");

    if (input.code !== current.code && (await currencyRepository.findByCode(input.code, tx))) {
      throw new CurrencyServiceError("DUPLICATE_CODE");
    }

    return currencyRepository.updateDetails(id, input, tx);
  });
}

export async function setCurrencyActive(id: string, isActive: boolean) {
  if (!(await currencyRepository.findById(id))) {
    throw new CurrencyServiceError("NOT_FOUND");
  }
  return currencyRepository.setActive(id, isActive);
}

/** Intercambia la moneda con su vecina. Al terminar el orden queda 1..n. */
export async function moveCurrency(id: string, direction: "up" | "down") {
  const all = await currencyRepository.listAll();
  const index = all.findIndex((currency) => currency.id === id);
  if (index === -1) throw new CurrencyServiceError("NOT_FOUND");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return; // ya está en el extremo

  const ids = all.map((currency) => currency.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await currencyRepository.reorder(ids);
}