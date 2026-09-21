//src/server/auth/constants.ts
export const SESSION_COOKIE_NAME = "exchange_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;