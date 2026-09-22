//src/app/(admin)/admin/settings/page.tsx
import type { Metadata } from "next";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { LogoManager } from "@/components/admin/logo-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getCompanySettings } from "@/server/services/settings.service";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Nombre, nota del pie, frecuencia de actualización y logo de la compañía."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="General"
            description="Se refleja en el panel, el inicio de sesión y la pantalla pública."
          />
          <div className="p-5 sm:p-6">
            <CompanySettingsForm
              initial={{
                companyName: settings.companyName,
                footerNote: settings.footerNote ?? "",
                refreshSeconds: String(settings.refreshSeconds),
              }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Logo" description="Aparece junto al nombre en la pantalla pública." />
          <div className="p-5 sm:p-6">
            <LogoManager hasLogo={settings.hasLogo} logoVersion={settings.updatedAt.getTime()} />
          </div>
        </Card>
      </div>
    </div>
  );
}