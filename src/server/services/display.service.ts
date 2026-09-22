//src/server/services/display.service.ts
import "server-only";
import { clampRefreshSeconds, type DisplayData } from "@/lib/display";
import { formatRate } from "@/lib/format";
import { formatAppDateTime, getAppTimeZone } from "@/server/format";
import { currencyRepository, settingsRepository } from "@/server/repositories";

/** Datos de la pantalla pública: solo monedas activas y en el orden configurado. */
export async function getDisplayData(): Promise<DisplayData> {
  const [settings, currencies] = await Promise.all([
    settingsRepository.get(),
    currencyRepository.listActive(),
  ]);

  const lastUpdate = currencies.reduce<Date | null>(
    (latest, currency) =>
      !latest || currency.ratesUpdatedAt > latest ? currency.ratesUpdatedAt : latest,
    null,
  );

  return {
    companyName: settings.companyName,
    // La ruta /api/logo se crea en la Etapa 8. Sin logo configurado es null.
    logoUrl: settings.hasLogo ? `/api/logo?v=${settings.updatedAt.getTime()}` : null,
    footerNote: settings.footerNote,
    refreshSeconds: clampRefreshSeconds(settings.refreshSeconds),
    timeZone: getAppTimeZone() ?? null,
    ratesUpdatedText: lastUpdate ? formatAppDateTime(lastUpdate) : null,
    generatedAt: new Date().toISOString(),
    currencies: currencies.map((currency) => ({
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      flagCode: currency.flagCode,
      buyRate: currency.buyRate,
      sellRate: currency.sellRate,
      buyText: formatRate(currency.buyRate),
      sellText: formatRate(currency.sellRate),
    })),
  };
}