//src/app/(admin)/admin/currencies/[id]/edit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CurrencyForm } from "@/components/admin/currency-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/server/auth/session";
import { getCurrency } from "@/server/services/currency.service";

export const metadata: Metadata = { title: "Editar moneda" };

export default async function EditCurrencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");

  const { id } = await params;
  const currency = await getCurrency(id);
  if (!currency) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/currencies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a monedas
      </Link>
      <PageHeader title={`Editar ${currency.code}`} description={currency.name} />
      <CurrencyForm
        mode="edit"
        currency={{
          id: currency.id,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          flagCode: currency.flagCode,
          buyRate: currency.buyRate,
          sellRate: currency.sellRate,
        }}
      />
    </div>
  );
}