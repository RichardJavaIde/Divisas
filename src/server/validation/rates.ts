//src/server/validation/rates.ts
import { z } from "zod";
import { checkRatePair } from "@/lib/rates";

export type SaveRatesResult =
  | { ok: true; changed: number }
  | { ok: false; error: string; stale?: boolean };

/** Forma del mensaje que envía el navegador: solo las filas modificadas. */
export const saveRatesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      buyRate: z.string().max(30),
      sellRate: z.string().max(30),
      // ratesUpdatedAt (ISO) con el que se cargó la pantalla
      version: z
        .string()
        .max(40)
        .refine((value) => !Number.isNaN(Date.parse(value))),
    }),
  )
  .min(1)
  .max(200)
  .refine((rows) => new Set(rows.map((row) => row.id)).size === rows.length);

export interface RateUpdate {
  id: string;
  buyRate: number;
  sellRate: number;
  expectedVersion: Date;
}

export function validateRateUpdates(
  rows: z.infer<typeof saveRatesSchema>,
): { ok: true; updates: RateUpdate[] } | { ok: false; error: string } {
  const updates: RateUpdate[] = [];

  for (const row of rows) {
    const { buyRate, sellRate, errors } = checkRatePair(row.buyRate, row.sellRate);

    if (buyRate === null || sellRate === null || errors.buyRate || errors.sellRate) {
      return { ok: false, error: "Hay valores inválidos. Revisa las tasas marcadas." };
    }

    updates.push({
      id: row.id,
      buyRate,
      sellRate,
      expectedVersion: new Date(row.version),
    });
  }

  return { ok: true, updates };
}