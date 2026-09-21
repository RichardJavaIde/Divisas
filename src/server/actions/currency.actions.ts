//src/server/actions/currency.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import {
  CurrencyServiceError,
  createCurrency,
  moveCurrency,
  setCurrencyActive,
  updateCurrencyDetails,
} from "@/server/services/currency.service";
import {
  collectFieldErrors,
  currencyCreateSchema,
  currencyDetailsSchema,
  type ActionResult,
  type CurrencyFormState,
  type CurrencyFormValues,
} from "@/server/validation/currency";

const idSchema = z.string().min(1).max(64);
const directionSchema = z.enum(["up", "down"]);

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, 100) : "";
}

function readValues(formData: FormData): CurrencyFormValues {
  return {
    code: text(formData, "code"),
    name: text(formData, "name"),
    symbol: text(formData, "symbol"),
    flagCode: text(formData, "flagCode"),
    buyRate: text(formData, "buyRate"),
    sellRate: text(formData, "sellRate"),
    isActive: formData.get("isActive") === "on" ? "on" : "",
  };
}

function messageFor(error: unknown): string {
  if (error instanceof CurrencyServiceError) return error.message;
  console.error(error);
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

function formErrorFor(error: unknown, values: CurrencyFormValues): CurrencyFormState {
  if (error instanceof CurrencyServiceError && error.code === "DUPLICATE_CODE") {
    return { values, fieldErrors: { code: error.message } };
  }
  return { values, error: messageFor(error) };
}

function refreshViews() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function createCurrencyAction(
  _previous: CurrencyFormState,
  formData: FormData,
): Promise<CurrencyFormState> {
  const actor = await requireRole("ADMIN");
  const values = readValues(formData);

  const parsed = currencyCreateSchema.safeParse({
    ...values,
    isActive: values.isActive === "on",
  });
  if (!parsed.success) {
    return { values, fieldErrors: collectFieldErrors(parsed.error) };
  }

  try {
    await createCurrency(parsed.data, actor);
  } catch (error) {
    return formErrorFor(error, values);
  }

  refreshViews();
  redirect("/admin/currencies"); // redirect lanza una excepción: va fuera del try
}

export async function updateCurrencyAction(
  id: string,
  _previous: CurrencyFormState,
  formData: FormData,
): Promise<CurrencyFormState> {
  await requireRole("ADMIN");
  const values = readValues(formData);

  if (!idSchema.safeParse(id).success) {
    return { values, error: "Solicitud inválida." };
  }

  const parsed = currencyDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: collectFieldErrors(parsed.error) };
  }

  try {
    await updateCurrencyDetails(id, parsed.data);
  } catch (error) {
    return formErrorFor(error, values);
  }

  refreshViews();
  redirect("/admin/currencies");
}

export async function setCurrencyActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  if (!idSchema.safeParse(id).success || typeof isActive !== "boolean") {
    return { ok: false, error: "Solicitud inválida." };
  }

  try {
    await setCurrencyActive(id, isActive);
  } catch (error) {
    return { ok: false, error: messageFor(error) };
  }

  refreshViews();
  return { ok: true };
}

export async function moveCurrencyAction(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireRole("ADMIN");

  if (!idSchema.safeParse(id).success || !directionSchema.safeParse(direction).success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  try {
    await moveCurrency(id, direction);
  } catch (error) {
    return { ok: false, error: messageFor(error) };
  }

  refreshViews();
  return { ok: true };
}