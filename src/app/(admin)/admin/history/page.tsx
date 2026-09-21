//src/app/(admin)/admin/history/page.tsx
import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/coming-soon";
import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Historial" };

export default async function HistoryPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader title="Historial" description="Registro de todos los cambios de tasas." />
      <ComingSoon stage={6} description="Aquí verás quién cambió cada tasa y cuándo." />
    </div>
  );
}