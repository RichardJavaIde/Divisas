//src/server/validation/settings.ts
import { z } from "zod";
import { MAX_REFRESH_SECONDS, MIN_REFRESH_SECONDS } from "@/lib/display";

export type SettingsField = "companyName" | "footerNote" | "refreshSeconds";
export type SettingsFormValues = Partial<Record<SettingsField, string>>;

export interface SettingsFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<SettingsField, string>>;
  values?: SettingsFormValues;
}

export interface LogoActionState {
  error?: string;
  success?: boolean;
}

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(2, "Mínimo 2 caracteres.").max(60, "Máximo 60 caracteres."),
  footerNote: z
    .string()
    .trim()
    .max(160, "Máximo 160 caracteres.")
    .transform((value) => (value === "" ? null : value)),
  refreshSeconds: z
    .string()
    .trim()
    .regex(/^\d+$/, "Ingresa solo números.")
    .transform(Number)
    .refine(
      (value) => value >= MIN_REFRESH_SECONDS && value <= MAX_REFRESH_SECONDS,
      `Debe estar entre ${MIN_REFRESH_SECONDS} y ${MAX_REFRESH_SECONDS} segundos.`,
    ),
});

export function collectFieldErrors(error: z.ZodError): Partial<Record<SettingsField, string>> {
  const result: Partial<Record<SettingsField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) result[key as SettingsField] = issue.message;
  }
  return result;
}