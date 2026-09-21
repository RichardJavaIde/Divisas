//src/app/(admin)/admin/currencies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CurrencyList } from "@/components/admin/currency-list";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClasses } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";
import { listCurrencies } from "@/server/services/currency.service";

export const metadata: Metadata = { title: "Monedas" };

export default async function CurrenciesPage() {
  await requireRole("ADMIN");
  const currencies = await listCurrencies();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monedas"
        description="Crea, edita, activa y ordena las monedas."
        actions={
          <Link href="/admin/currencies/new" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden />
            Nueva moneda
          </Link>
        }
      />

      <CurrencyList
        currencies={currencies.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          flagCode: c.flagCode,
          buyRate: c.buyRate,
          sellRate: c.sellRate,
          isActive: c.isActive,
        }))}
      />
    </div>
  );
}