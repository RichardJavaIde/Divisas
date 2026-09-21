//src/app/(admin)/admin/settings/page.tsx
import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/coming-soon";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  await requireRole("ADMIN");
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Nombre y logo de la compañía." />
      <ComingSoon stage={8} description="Aquí configurarás el nombre y el logo." />
    </div>
  );
}