//src/server/auth/redirect.ts
/** Solo permite volver a rutas internas del panel. */
export function safeRedirectPath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string") return fallback;
  if (value.includes("\\")) return fallback;
  return /^\/admin(?:[/?#]|$)/.test(value) ? value : fallback;
}