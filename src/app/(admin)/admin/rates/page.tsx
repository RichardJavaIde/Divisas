//src/app/(admin)/admin/rates/page.tsx
import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/coming-soon";
import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Tasas" };

export default async function RatesPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader title="Tasas" description="Actualiza los precios de compra y venta." />
      <ComingSoon stage={6} description="Aquí cambiarás las tasas de compra y venta." />
    </div>
  );
}