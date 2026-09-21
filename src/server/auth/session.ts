//src/server/auth/session.ts
import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionRepository } from "@/server/repositories";
import type { UserRecord, UserRole } from "@/server/domain/types";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./constants";
import { generateToken, hashToken } from "./tokens";

function shouldUseSecureCookie(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV === "production";
}

/** Crea la sesión en la base de datos y la cookie en el navegador. */
export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const h = await headers();
  // Solo informativo: estas cabeceras pueden ser falsificadas
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;

  await sessionRepository.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
    ipAddress,
    userAgent: h.get("user-agent"),
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Sesión válida de la petición actual (se calcula una sola vez por petición). */
export const getSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return sessionRepository.findValidByTokenHash(hashToken(token));
});

export async function getCurrentUser(): Promise<UserRecord | null> {
  return (await getSession())?.user ?? null;
}

/** Úsalo en layouts, páginas y Server Actions protegidos. */
export async function requireUser(): Promise<UserRecord> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Igual que requireUser, pero además exige uno de los roles indicados. */
export async function requireRole(...roles: UserRole[]): Promise<UserRecord> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/admin");
  return user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token) await sessionRepository.deleteByTokenHash(hashToken(token));
  jar.delete(SESSION_COOKIE_NAME);
}