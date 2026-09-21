//src/server/services/auth.service.ts
import "server-only";
import { LOCKOUT_MINUTES, MAX_FAILED_ATTEMPTS } from "@/server/auth/constants";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { sessionRepository, userRepository } from "@/server/repositories";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; retryAfterMinutes: number };

// Hash de relleno: se compara cuando el usuario no existe para igualar tiempos
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("contraseña-de-relleno"));

export async function authenticate(
  username: string,
  password: string,
): Promise<AuthResult> {
  const user = await userRepository.findCredentialsByUsername(username);

  if (!user) {
    await verifyPassword(password, await getDummyHash());
    return { ok: false, reason: "invalid" };
  }

  const now = new Date();

  if (user.lockedUntil && user.lockedUntil > now) {
    return {
      ok: false,
      reason: "locked",
      retryAfterMinutes: Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000),
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const shouldLock = user.failedAttempts + 1 >= MAX_FAILED_ATTEMPTS;
    await userRepository.registerLoginFailure(
      user.id,
      shouldLock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null,
    );
    return shouldLock
      ? { ok: false, reason: "locked", retryAfterMinutes: LOCKOUT_MINUTES }
      : { ok: false, reason: "invalid" };
  }

  // Cuenta desactivada: mismo mensaje genérico para no dar pistas
  if (!user.isActive) return { ok: false, reason: "invalid" };

  await userRepository.registerLoginSuccess(user.id);
  await sessionRepository.deleteExpired(); // limpieza oportunista

  return { ok: true, userId: user.id };
}