//src/server/actions/auth.actions.ts
"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/server/auth/redirect";
import { createSession, destroySession } from "@/server/auth/session";
import { authenticate } from "@/server/services/auth.service";
import { loginSchema, type LoginFormState } from "@/server/validation/auth";

export async function loginAction(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const rawUsername = formData.get("username");
  const username = typeof rawUsername === "string" ? rawUsername.trim().slice(0, 64) : "";

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Ingresa tu usuario y contraseña.", username };
  }

  const result = await authenticate(parsed.data.username, parsed.data.password);

  if (!result.ok) {
    return {
      username,
      error:
        result.reason === "locked"
          ? `Demasiados intentos fallidos. Intenta de nuevo en ${result.retryAfterMinutes} min.`
          : "Usuario o contraseña incorrectos.",
    };
  }

  await createSession(result.userId);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}