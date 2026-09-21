//src/server/services/rate.service.ts
import "server-only";
import { withTransaction } from "@/server/db/client";
import type { UserRecord } from "@/server/domain/types";
import { currencyRepository, rateHistoryRepository } from "@/server/repositories";
import type { RateUpdate } from "@/server/validation/rates";

type RateErrorCode = "CONFLICT" | "NOT_FOUND";

export class RateServiceError extends Error {
  readonly code: RateErrorCode;

  constructor(code: RateErrorCode, currencyCodes: string[] = []) {
    super(
      code === "CONFLICT"
        ? `Otra persona modificó ${
            currencyCodes.length === 1 ? "la tasa de" : "las tasas de"
          } ${currencyCodes.join(", ")} mientras editabas. No se guardó ningún cambio.`
        : "Una de las monedas ya no existe. Recarga la página.",
    );
    this.name = "RateServiceError";
    this.code = code;
  }
}

/**
 * Aplica todos los cambios de tasas o ninguno.
 * Cada moneda que realmente cambió deja una fila en el historial.
 */
export async function updateRates(
  updates: RateUpdate[],
  actor: Pick<UserRecord, "id" | "name">,
): Promise<{ changed: number }> {
  return withTransaction(async (tx) => {
    const conflicts: string[] = [];
    let changed = 0;

    for (const update of updates) {
      const current = await currencyRepository.findById(update.id, tx);
      if (!current) throw new RateServiceError("NOT_FOUND");

      // Sin diferencias reales: no se toca nada y no se ensucia el historial
      if (current.buyRate === update.buyRate && current.sellRate === update.sellRate) {
        continue;
      }

      const applied = await currencyRepository.updateRatesIfUnchanged(
        update.id,
        update.expectedVersion,
        update.buyRate,
        update.sellRate,
        tx,
      );

      if (!applied) {
        conflicts.push(current.code);
        continue;
      }

      await rateHistoryRepository.create(
        {
          currencyId: current.id,
          currencyCode: current.code,
          previousBuyRate: current.buyRate,
          previousSellRate: current.sellRate,
          newBuyRate: update.buyRate,
          newSellRate: update.sellRate,
          changedById: actor.id,
          changedByName: actor.name,
        },
        tx,
      );
      changed += 1;
    }

    // Lanzar dentro de la transacción la deshace por completo
    if (conflicts.length > 0) throw new RateServiceError("CONFLICT", conflicts);

    return { changed };
  });
}