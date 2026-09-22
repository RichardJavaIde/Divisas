//src/server/actions/user.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import {
  UserServiceError,
  createUser,
  resetUserPassword,
  setUserActive,
  updateUserProfile,
} from "@/server/services/user.service";
import {
  collectFieldErrors,
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  type ActionResult,
  type PasswordField,
  type PasswordFormState,
  type UserField,
  type UserFormState,
  type UserFormValues,
} from "@/server/validation/user";

const idSchema = z.string().min(1).max(64);

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, 100) : "";
}

function messageFor(error: unknown): string {
  if (error instanceof UserServiceError) return error.message;
  console.error(error);
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

function refreshViews() {
  revalidatePath("/admin/users");
}

export async function createUserAction(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole("ADMIN");

  const values: UserFormValues = {
    username: text(formData, "username"),
    name: text(formData, "name"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
    role: text(formData, "role"),
  };

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: collectFieldErrors<UserField>(parsed.error) };
  }

  try {
    await createUser(parsed.data);
  } catch (error) {
    if (error instanceof UserServiceError && error.code === "DUPLICATE_USERNAME") {
      return { values, fieldErrors: { username: error.message } };
    }
    return { values, error: messageFor(error) };
  }

  refreshViews();
  redirect("/admin/users"); // redirect lanza una excepción: va fuera del try
}

export async function updateUserAction(
  id: string,
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole("ADMIN");

  const values: UserFormValues = {
    name: text(formData, "name"),
    role: text(formData, "role"),
  };
  const isActive = formData.get("isActive") === "on";

  if (!idSchema.safeParse(id).success) {
    return { values, error: "Solicitud inválida." };
  }

  const parsed = updateUserSchema.safeParse({ ...values, isActive });
  if (!parsed.success) {
    return { values, fieldErrors: collectFieldErrors<UserField>(parsed.error) };
  }

  try {
    await updateUserProfile(id, parsed.data);
  } catch (error) {
    return { values, error: messageFor(error) };
  }

  refreshViews();
  redirect("/admin/users");
}

export async function setUserActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireRole("ADMIN");

  if (!idSchema.safeParse(id).success || typeof isActive !== "boolean") {
    return { ok: false, error: "Solicitud inválida." };
  }

  try {
    await setUserActive(id, isActive);
  } catch (error) {
    return { ok: false, error: messageFor(error) };
  }

  refreshViews();
  return { ok: true };
}

export async function resetPasswordAction(
  id: string,
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  await requireRole("ADMIN");

  if (!idSchema.safeParse(id).success) {
    return { error: "Solicitud inválida." };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors<PasswordField>(parsed.error) };
  }

  try {
    await resetUserPassword(id, parsed.data.password);
  } catch (error) {
    return { error: messageFor(error) };
  }

  return { success: true };
}