//src/app/(admin)/admin/layout.tsx
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/server/auth/session";
import { settingsRepository } from "@/server/repositories";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings] = await Promise.all([
    requireUser(),
    settingsRepository.get(),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, role: user.role }}
      companyName={settings.companyName}
    >
      {children}
    </AdminShell>
  );
}