//src/server/validation/currency.ts
import { z } from "zod";

export type CurrencyField =
  | "code"
  | "name"
  | "symbol"
  | "flagCode"
  | "buyRate"
  | "sellRate";

export type CurrencyFormValues = Partial<Record<CurrencyField | "isActive", string>>;

/** Estado que devuelven las acciones de crear y editar al formulario. */
export interface CurrencyFormState {
  error?: string;
  fieldErrors?: Partial<Record<CurrencyField, string>>;
  values?: CurrencyFormValues;
}

/** Resultado de las acciones que no redirigen (activar, mover). */
export type ActionResult = { ok: true } | { ok: false; error: string };

// Acepta "58", "58.5" o "58,5". Sin separadores de miles.
const rateField = z
  .string()
  .trim()
  .min(1, "Ingresa un valor.")
  .regex(/^\d+(?:[.,]\d{1,6})?$/, "Usa solo números y un separador decimal (ej. 58.50).")
  .transform((value) => Number(value.replace(",", ".")))
  .refine((value) => value > 0, "Debe ser mayor que 0.")
  .refine((value) => value <= 1_000_000, "El valor es demasiado alto.");

const detailsShape = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Mínimo 2 caracteres.")
    .max(8, "Máximo 8 caracteres.")
    .regex(/^[A-Z0-9-]+$/, "Solo letras, números y guion (ej. USD, EUR, USD-P)."),
  name: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres.")
    .max(60, "Máximo 60 caracteres."),
  symbol: z
    .string()
    .trim()
    .max(5, "Máximo 5 caracteres.")
    .transform((value) => (value === "" ? null : value)),
  flagCode: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || /^[a-z]{2}$/.test(value),
      "Usa 2 letras del país (ej. us, eu, do).",
    )
    .transform((value) => (value === "" ? null : value)),
};

export const currencyDetailsSchema = z.object(detailsShape);

export const currencyCreateSchema = z
  .object({
    ...detailsShape,
    buyRate: rateField,
    sellRate: rateField,
    isActive: z.boolean(),
  })
  .refine((data) => data.sellRate >= data.buyRate, {
    message: "La venta no puede ser menor que la compra.",
    path: ["sellRate"],
  });

/** Un mensaje por campo (el primero que aparezca). */
export function collectFieldErrors(
  error: z.ZodError,
): Partial<Record<CurrencyField, string>> {
  const result: Partial<Record<CurrencyField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) {
      result[key as CurrencyField] = issue.message;
    }
  }
  return result;
}