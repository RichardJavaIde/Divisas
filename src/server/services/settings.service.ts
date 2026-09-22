//src/server/services/settings.service.ts
import "server-only";
import { ALLOWED_LOGO_TYPES, MAX_LOGO_BYTES, MAX_LOGO_LABEL } from "@/lib/logo";
import { settingsRepository } from "@/server/repositories";

type SettingsErrorCode = "TOO_LARGE" | "INVALID_TYPE";

const MESSAGES: Record<SettingsErrorCode, string> = {
  TOO_LARGE: `La imagen no puede superar ${MAX_LOGO_LABEL}.`,
  INVALID_TYPE: "Formato no admitido. Usa PNG, JPG o WEBP.",
};

export class SettingsServiceError extends Error {
  readonly code: SettingsErrorCode;

  constructor(code: SettingsErrorCode) {
    super(MESSAGES[code]);
    this.name = "SettingsServiceError";
    this.code = code;
  }
}

export function getCompanySettings() {
  return settingsRepository.get();
}

export function updateCompanySettings(input: {
  companyName: string;
  footerNote: string | null;
  refreshSeconds: number;
  rowsPerPage: number;
  rotationSeconds: number;
}) {
  return settingsRepository.update(input);
}

export async function replaceLogo(file: { buffer: Buffer; mimeType: string; size: number }) {
  if (file.size > MAX_LOGO_BYTES) throw new SettingsServiceError("TOO_LARGE");
  if (!(ALLOWED_LOGO_TYPES as readonly string[]).includes(file.mimeType)) {
    throw new SettingsServiceError("INVALID_TYPE");
  }
  await settingsRepository.setLogo(file.buffer, file.mimeType);
}

export function removeCompanyLogo() {
  return settingsRepository.removeLogo();
}