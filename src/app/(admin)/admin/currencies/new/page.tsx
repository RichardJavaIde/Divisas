//ssrc/app/(admin)/admin/currencies/new/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CurrencyForm } from "@/components/admin/currency-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Nueva moneda" };

export default async function NewCurrencyPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/currencies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a monedas
      </Link>
      <PageHeader title="Nueva moneda" description="Define los datos y las tasas iniciales." />
      <CurrencyForm mode="create" />
    </div>
  );
}