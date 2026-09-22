//src/server/validation/settings.ts
import { z } from "zod";
import {
  MAX_REFRESH_SECONDS,
  MAX_ROTATION_SECONDS,
  MAX_ROWS_PER_PAGE,
  MIN_REFRESH_SECONDS,
  MIN_ROTATION_SECONDS,
  MIN_ROWS_PER_PAGE,
} from "@/lib/display";

export type SettingsField =
  | "companyName"
  | "footerNote"
  | "refreshSeconds"
  | "rowsPerPage"
  | "rotationSeconds";
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

const wholeNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Ingresa solo números.")
    .transform(Number)
    .refine((value) => value >= min && value <= max, `Debe estar entre ${min} y ${max}.`);

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(2, "Mínimo 2 caracteres.").max(60, "Máximo 60 caracteres."),
  footerNote: z
    .string()
    .trim()
    .max(160, "Máximo 160 caracteres.")
    .transform((value) => (value === "" ? null : value)),
  refreshSeconds: wholeNumber(MIN_REFRESH_SECONDS, MAX_REFRESH_SECONDS),
  rowsPerPage: wholeNumber(MIN_ROWS_PER_PAGE, MAX_ROWS_PER_PAGE),
  rotationSeconds: wholeNumber(MIN_ROTATION_SECONDS, MAX_ROTATION_SECONDS),
});

export function collectFieldErrors(error: z.ZodError): Partial<Record<SettingsField, string>> {
  const result: Partial<Record<SettingsField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) result[key as SettingsField] = issue.message;
  }
  return result;
}