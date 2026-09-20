import { currencyRepository, settingsRepository } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function PublicDisplayPage() {
  const [settings, currencies] = await Promise.all([
    settingsRepository.get(),
    currencyRepository.listActive(),
  ]);

  return (
    <main className="min-h-dvh bg-brand-900 p-8 text-white md:p-12">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        {settings.companyName}
      </h1>
      <p className="mt-2 text-brand-200">Prueba de base de datos · Etapa 2</p>

      <ul className="mt-8 max-w-2xl divide-y divide-white/10">
        {currencies.map((c) => (
          <li key={c.id} className="tabular flex items-center justify-between py-3 text-lg">
            <span className="font-semibold">
              {c.code} <span className="font-normal text-brand-200">{c.name}</span>
            </span>
            <span>
              {c.buyRate.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              {" / "}
              {c.sellRate.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}