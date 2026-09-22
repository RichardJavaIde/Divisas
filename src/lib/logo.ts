//src/lib/logo.ts
export const MAX_LOGO_BYTES = 1_500_000; // 1.5 MB
export const MAX_LOGO_LABEL = "1.5 MB";

export const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedLogoType = (typeof ALLOWED_LOGO_TYPES)[number];

export const LOGO_ACCEPT = ALLOWED_LOGO_TYPES.join(",");

export function isAllowedLogoType(value: string): value is AllowedLogoType {
  return (ALLOWED_LOGO_TYPES as readonly string[]).includes(value);
}