//src/app/(admin)/admin/rates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { History as HistoryIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { RatesEditor } from "@/components/admin/rates-editor";
import { buttonClasses } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { formatAppDateTime } from "@/server/format";
import { listCurrencies } from "@/server/services/currency.service";

export const metadata: Metadata = { title: "Tasas" };

export default async function RatesPage() {
  // Administradores y operadores pueden cambiar tasas
  await requireUser();
  const currencies = await listCurrencies();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasas"
        description="Modifica solo las que cambiaron y guarda. Cada cambio queda registrado en el historial."
        actions={
          <Link href="/admin/history" className={buttonClasses({ variant: "secondary" })}>
            <HistoryIcon className="size-4" aria-hidden />
            Ver historial
          </Link>
        }
      />

      <RatesEditor
        items={currencies.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          flagCode: c.flagCode,
          isActive: c.isActive,
          buyRate: c.buyRate,
          sellRate: c.sellRate,
          version: c.ratesUpdatedAt.toISOString(),
          // Se calculan aquí (servidor) para evitar diferencias de hora al hidratar
          updatedRelative: formatRelativeTime(c.ratesUpdatedAt),
          updatedExact: formatAppDateTime(c.ratesUpdatedAt),
        }))}
      />
    </div>
  );
}