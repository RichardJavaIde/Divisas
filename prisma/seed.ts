//prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();

const SETTINGS_ID = "singleton";

// Valores de ejemplo: se editarán desde el panel administrativo
const sampleCurrencies = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$", flagCode: "us", buyRate: 58.5, sellRate: 60.0 },
  { code: "EUR", name: "Euro", symbol: "€", flagCode: "eu", buyRate: 66.0, sellRate: 69.0 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", flagCode: "gb", buyRate: 77.0, sellRate: 81.0 },
  { code: "CAD", name: "Dólar canadiense", symbol: "$", flagCode: "ca", buyRate: 42.0, sellRate: 44.5 },
  { code: "CHF", name: "Franco suizo", symbol: "CHF", flagCode: "ch", buyRate: 70.0, sellRate: 74.0 },
  { code: "MXN", name: "Peso mexicano", symbol: "$", flagCode: "mx", buyRate: 3.1, sellRate: 3.4 },
  { code: "BRL", name: "Real brasileño", symbol: "R$", flagCode: "br", buyRate: 10.2, sellRate: 11.4 },
  { code: "COP", name: "Peso colombiano", symbol: "$", flagCode: "co", buyRate: 0.0135, sellRate: 0.0158 },
];

async function seedSettings() {
  await prisma.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      companyName: "Casa de Cambio",
      footerNote: "Tasas sujetas a cambio sin previo aviso",
    },
  });
  console.log("✔ Configuración de la compañía lista");
}

async function seedAdmin() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (password.length < 10) {
    throw new Error("Define SEED_ADMIN_PASSWORD en .env (mínimo 10 caracteres).");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`• El usuario "${username}" ya existe, no se modifica`);
    return;
  }

  await prisma.user.create({
    data: {
      username,
      name: "Administrador",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });
  console.log(`✔ Usuario administrador creado: "${username}"`);
}

async function seedCurrencies() {
  if ((await prisma.currency.count()) > 0) {
    console.log("• Ya existen monedas, se omite el ejemplo");
    return;
  }

  for (const [index, c] of sampleCurrencies.entries()) {
    await prisma.$transaction(async (tx) => {
      const created = await tx.currency.create({
        data: { ...c, displayOrder: index + 1 },
      });
      await tx.rateHistory.create({
        data: {
          currencyId: created.id,
          currencyCode: created.code,
          previousBuyRate: null,
          previousSellRate: null,
          newBuyRate: c.buyRate,
          newSellRate: c.sellRate,
          changedByName: "sistema",
        },
      });
    });
  }
  console.log(`✔ ${sampleCurrencies.length} monedas de ejemplo creadas`);
}

async function main() {
  await seedSettings();
  await seedAdmin();
  await seedCurrencies();
}

main()
  .catch((error) => {
    console.error("✘ Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());