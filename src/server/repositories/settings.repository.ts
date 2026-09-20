import "server-only";
import type { CompanySetting as SettingRow } from "@prisma/client";
import { prisma, type DbClient } from "@/server/db/client";
import type { CompanySettingsRecord } from "@/server/domain/types";

const SETTINGS_ID = "singleton";

function toRecord(row: SettingRow): CompanySettingsRecord {
  return {
    companyName: row.companyName,
    logoPath: row.logoPath,
    footerNote: row.footerNote,
    refreshSeconds: row.refreshSeconds,
    updatedAt: row.updatedAt,
  };
}

export async function get(db: DbClient = prisma): Promise<CompanySettingsRecord> {
  const row =
    (await db.companySetting.findUnique({ where: { id: SETTINGS_ID } })) ??
    (await db.companySetting.create({ data: { id: SETTINGS_ID } }));
  return toRecord(row);
}

export async function update(
  data: {
    companyName?: string;
    logoPath?: string | null;
    footerNote?: string | null;
    refreshSeconds?: number;
  },
  db: DbClient = prisma,
): Promise<CompanySettingsRecord> {
  const row = await db.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
  return toRecord(row);
}