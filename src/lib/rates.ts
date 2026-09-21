//src/lib/rates.ts 
export const MAX_RATE = 1_000_000;

// Acepta "58", "58.5", "58,5" y hasta 6 decimales. Sin separador de miles.
const RATE_PATTERN = /^\d+(?:[.,]\d{0,6})?$/;

export interface RateFieldErrors {
  buyRate?: string;
  sellRate?: string;
}

/** Convierte el texto escrito en un número, o null si no es válido. */
export function parseRate(input: string): number | null {
  const value = input.trim();
  if (!RATE_PATTERN.test(value)) return null;
  const parsed = Number(value.replace(",", "."));
  return parsed > 0 && parsed <= MAX_RATE ? parsed : null;
}

/** Regla de negocio compartida por el formulario y el servidor. */
export function checkRatePair(buyInput: string, sellInput: string) {
  const buyRate = parseRate(buyInput);
  const sellRate = parseRate(sellInput);
  const errors: RateFieldErrors = {};

  if (buyRate === null) errors.buyRate = "Valor inválido (ej. 58.50).";
  if (sellRate === null) {
    errors.sellRate = "Valor inválido (ej. 58.50).";
  } else if (buyRate !== null && sellRate < buyRate) {
    errors.sellRate = "La venta no puede ser menor que la compra.";
  }

  return { buyRate, sellRate, errors };
}

/** Valor para mostrar en un campo: siempre al menos 2 decimales. */
export function toInputValue(value: number): string {
  const [integer, decimals = ""] = value.toString().split(".");
  return `${integer}.${decimals.padEnd(2, "0")}`;
}

export function percentChange(previous: number, next: number): number {
  return previous === 0 ? 0 : ((next - previous) / previous) * 100;
}