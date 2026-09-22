//src/app/(admin)/admin/users/new/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NewUserPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a usuarios
      </Link>
      <PageHeader title="Nuevo usuario" description="Crea una cuenta de acceso al panel." />
      <UserForm mode="create" />
    </div>
  );
}