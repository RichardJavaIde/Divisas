//src/server/validation/user.ts
import { z } from "zod";

export type UserField = "username" | "name" | "password" | "confirmPassword" | "role";
export type UserFormValues = Partial<Record<UserField, string>>;

export interface UserFormState {
  error?: string;
  fieldErrors?: Partial<Record<UserField, string>>;
  values?: UserFormValues;
}

export type PasswordField = "password" | "confirmPassword";
export interface PasswordFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<PasswordField, string>>;
}

/** Resultado de las acciones que no redirigen (activar/desactivar). */
export type ActionResult = { ok: true } | { ok: false; error: string };

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres.")
  .max(32, "Máximo 32 caracteres.")
  .regex(/^[a-z0-9._-]+$/, "Solo minúsculas, números, punto, guion y guion bajo.");

const name = z.string().trim().min(2, "Mínimo 2 caracteres.").max(60, "Máximo 60 caracteres.");

const password = z.string().min(10, "Mínimo 10 caracteres.").max(100, "Máximo 100 caracteres.");

// Debe coincidir con USER_ROLES en src/server/domain/types.ts
const role = z.enum(["ADMIN", "OPERATOR"], { message: "Selecciona un rol válido." });

export const createUserSchema = z
  .object({ username, name, password, confirmPassword: z.string(), role })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  name,
  role,
  isActive: z.boolean(),
});

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export function collectFieldErrors<F extends string>(
  error: z.ZodError,
): Partial<Record<F, string>> {
  const result: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) result[key as F] = issue.message;
  }
  return result;
}