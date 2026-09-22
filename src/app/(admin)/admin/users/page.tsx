//src/app/(admin)/admin/users/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { UserList } from "@/components/admin/user-list";
import { buttonClasses } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";
import { listUsers } from "@/server/services/user.service";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const actor = await requireRole("ADMIN");
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Administra quién puede entrar al panel y con qué rol."
        actions={
          <Link href="/admin/users/new" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden />
            Nuevo usuario
          </Link>
        }
      />

      <UserList
        currentUserId={actor.id}
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        }))}
      />
    </div>
  );
}