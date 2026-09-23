import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const [settings, users, currencies, rateHistory] = await Promise.all([
    prisma.companySetting.findMany(),
    prisma.user.findMany(),
    prisma.currency.findMany(),
    prisma.rateHistory.findMany(),
  ]);

  const data = {
    settings: settings.map((s) => ({
      id: s.id,
      companyName: s.companyName,
      footerNote: s.footerNote,
      refreshSeconds: s.refreshSeconds,
      rowsPerPage: s.rowsPerPage,
      rotationSeconds: s.rotationSeconds,
      // Los bytes del logo se codifican en base64 para poder guardarlos en JSON
      logoData: s.logoData ? Buffer.from(s.logoData).toString("base64") : null,
      logoMimeType: s.logoMimeType,
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      passwordHash: u.passwordHash,
      role: u.role,
      isActive: u.isActive,
      failedAttempts: u.failedAttempts,
      lockedUntil: u.lockedUntil?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    currencies: currencies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      flagCode: c.flagCode,
      buyRate: c.buyRate.toString(),
      sellRate: c.sellRate.toString(),
      displayOrder: c.displayOrder,
      isActive: c.isActive,
      ratesUpdatedAt: c.ratesUpdatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    rateHistory: rateHistory.map((r) => ({
      id: r.id,
      currencyId: r.currencyId,
      currencyCode: r.currencyCode,
      previousBuyRate: r.previousBuyRate?.toString() ?? null,
      previousSellRate: r.previousSellRate?.toString() ?? null,
      newBuyRate: r.newBuyRate.toString(),
      newSellRate: r.newSellRate.toString(),
      changedAt: r.changedAt.toISOString(),
      changedById: r.changedById,
      changedByName: r.changedByName,
    })),
  };

  writeFileSync("data/export.json", JSON.stringify(data, null, 2));
  console.log(
    `✔ Exportado: ${data.users.length} usuarios, ${data.currencies.length} monedas, ` +
      `${data.rateHistory.length} cambios de tasa, ${data.settings.length} configuración(es).`,
  );
}

main().finally(() => prisma.$disconnect());