//src/app/(admin)/admin/users/[id]/edit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { UserForm } from "@/components/admin/user-form";
import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getUser } from "@/server/services/user.service";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");

  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a usuarios
      </Link>
      <PageHeader title={`Editar ${user.name}`} description={`@${user.username}`} />

      <UserForm
        mode="edit"
        user={{
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        }}
      />

      <Card className="max-w-2xl overflow-hidden">
        <CardHeader
          title="Restablecer contraseña"
          description="Define una nueva contraseña para este usuario. No se requiere la anterior."
        />
        <div className="p-5 sm:p-6">
          <ResetPasswordForm userId={user.id} />
        </div>
      </Card>
    </div>
  );
}