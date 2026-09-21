//src/app/(admin)/admin/currencies/page.tsx
import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/coming-soon";
import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Monedas" };

export default async function CurrenciesPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader title="Monedas" description="Crea, edita, activa y ordena las monedas." />
      <ComingSoon stage={5} description="Aquí administrarás el catálogo de monedas." />
    </div>
  );
}