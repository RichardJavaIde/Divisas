//src/server/repositories/settings.repository.ts
import "server-only";
import { prisma, type DbClient } from "@/server/db/client";
import type { CompanySettingsRecord, LogoRecord } from "@/server/domain/types";

const SETTINGS_ID = "singleton";

// Nunca incluye logoData: esa columna solo se lee en getLogo().
const SETTINGS_SELECT = {
  companyName: true,
  footerNote: true,
  refreshSeconds: true,
  rowsPerPage: true,
  rotationSeconds: true,
  logoMimeType: true,
  updatedAt: true,
} as const;

type SettingsRow = {
  companyName: string;
  footerNote: string | null;
  refreshSeconds: number;
  rowsPerPage: number;
  rotationSeconds: number;
  logoMimeType: string | null;
  updatedAt: Date;
};

function toRecord(row: SettingsRow): CompanySettingsRecord {
  return {
    companyName: row.companyName,
    footerNote: row.footerNote,
    refreshSeconds: row.refreshSeconds,
    rowsPerPage: row.rowsPerPage,
    rotationSeconds: row.rotationSeconds,
    hasLogo: row.logoMimeType !== null,
    updatedAt: row.updatedAt,
  };
}

export async function get(db: DbClient = prisma): Promise<CompanySettingsRecord> {
  const row =
    (await db.companySetting.findUnique({ where: { id: SETTINGS_ID }, select: SETTINGS_SELECT })) ??
    (await db.companySetting.create({ data: { id: SETTINGS_ID }, select: SETTINGS_SELECT }));
  return toRecord(row);
}

export async function update(
  data: {
    companyName: string;
    footerNote: string | null;
    refreshSeconds: number;
    rowsPerPage: number;
    rotationSeconds: number;
  },
  db: DbClient = prisma,
): Promise<CompanySettingsRecord> {
  const row = await db.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
    select: SETTINGS_SELECT,
  });
  return toRecord(row);
}

/** Lee los bytes del logo. Solo debe llamarse desde la ruta que los sirve. */
export async function getLogo(db: DbClient = prisma): Promise<LogoRecord | null> {
  const row = await db.companySetting.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoData: true, logoMimeType: true },
  });
  if (!row?.logoData || !row.logoMimeType) return null;
  // row.logoData ya es un Uint8Array; Buffer.from(...) lo envuelve sin copiar de más.
  return { data: Buffer.from(row.logoData), mimeType: row.logoMimeType };
}

export async function setLogo(
  data: Buffer,
  mimeType: string,
  db: DbClient = prisma,
): Promise<void> {
  // Uint8Array.from crea un Uint8Array<ArrayBuffer> "limpio", que es lo que Prisma espera para Bytes.
  const bytes = Uint8Array.from(data);
  await db.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: { logoData: bytes, logoMimeType: mimeType },
    create: { id: SETTINGS_ID, logoData: bytes, logoMimeType: mimeType },
  });
}

export async function removeLogo(db: DbClient = prisma): Promise<void> {
  await db.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: { logoData: null, logoMimeType: null },
    create: { id: SETTINGS_ID },
  });
}