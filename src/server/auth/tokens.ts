//src/server/auth/tokens.ts
import { createHash, randomBytes } from "node:crypto";

/** Token que viaja en la cookie. Nunca se guarda tal cual. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Lo que se guarda en la base de datos. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}