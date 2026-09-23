import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(readFileSync("data/export.json", "utf-8"));

  // Orden importante por las relaciones: settings y users primero,
  // luego currencies, y rateHistory al final (depende de las dos anteriores).
  await prisma.$transaction(
    async (tx) => {
      for (const s of data.settings) {
        await tx.companySetting.upsert({
          where: { id: s.id },
          update: {},
          create: {
            ...s,
            logoData: s.logoData ? Buffer.from(s.logoData, "base64") : null,
          },
        });
      }

      for (const u of data.users) {
        await tx.user.upsert({ where: { id: u.id }, update: {}, create: u });
      }

      for (const c of data.currencies) {
        await tx.currency.upsert({ where: { id: c.id }, update: {}, create: c });
      }

      for (const r of data.rateHistory) {
        await tx.rateHistory.upsert({ where: { id: r.id }, update: {}, create: r });
      }
    },
    { timeout: 30_000 },
  );

  console.log(
    `✔ Importado: ${data.users.length} usuarios, ${data.currencies.length} monedas, ` +
      `${data.rateHistory.length} cambios de tasa, ${data.settings.length} configuración(es).`,
  );
}

main().finally(() => prisma.$disconnect());