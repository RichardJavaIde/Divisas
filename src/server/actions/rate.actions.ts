//src/server/actions/rate.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { RateServiceError, updateRates } from "@/server/services/rate.service";
import {
  saveRatesSchema,
  validateRateUpdates,
  type SaveRatesResult,
} from "@/server/validation/rates";

export async function saveRatesAction(input: unknown): Promise<SaveRatesResult> {
  // Operadores y administradores pueden cambiar tasas
  const actor = await requireUser();

  const parsed = saveRatesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  const validated = validateRateUpdates(parsed.data);
  if (!validated.ok) return { ok: false, error: validated.error };

  try {
    const { changed } = await updateRates(validated.updates, actor);
    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return { ok: true, changed };
  } catch (error) {
    if (error instanceof RateServiceError) {
      return { ok: false, error: error.message, stale: error.code === "CONFLICT" };
    }
    console.error(error);
    return { ok: false, error: "No se pudieron guardar las tasas. Inténtalo de nuevo." };
  }
}