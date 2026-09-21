//src/app/(admin)/admin/users/page.tsx
import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/coming-soon";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  await requireRole("ADMIN");
  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Administra quién puede entrar al panel." />
      <ComingSoon stage={9} description="Aquí administrarás usuarios y roles." />
    </div>
  );
}