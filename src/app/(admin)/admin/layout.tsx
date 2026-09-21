//src/app/(admin)/admin/layout.tsx
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth.actions";
import { requireUser } from "@/server/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3 md:px-8">
        <span className="font-semibold">Panel administrativo</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-muted sm:inline">
            {user.name} · {user.role === "ADMIN" ? "Administrador" : "Operador"}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" size="sm">
              <LogOut className="size-4" aria-hidden />
              Salir
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}