//src/components/admin/admin-shell.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Landmark, LogOut, Menu, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth.actions";
import type { UserRole } from "@/server/domain/types";
import { SidebarNav } from "./sidebar-nav";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

interface AdminShellProps {
  user: { name: string; role: UserRole };
  companyName: string;
  children: ReactNode;
}

export function AdminShell({ user, companyName, children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Con el menú abierto: Esc lo cierra, se bloquea el scroll del fondo
  // y se cierra solo si la pantalla pasa a tamaño escritorio (rotar tablet).
  useEffect(() => {
    if (!menuOpen) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpointChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpointChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-surface-muted">
      {/* Fondo oscuro del menú móvil */}
      <div
        aria-hidden
        onClick={closeMenu}
        className={cn(
          "fixed inset-0 z-40 bg-brand-950/60 backdrop-blur-sm transition-opacity lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Sidebar: fijo en escritorio, deslizable en móvil y tablet */}
      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-900 text-white",
          "transition-[translate,visibility] duration-200 lg:w-64 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
          <Link href="/admin" onClick={closeMenu} className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Landmark className="size-5" aria-hidden />
            </span>
            <span className="truncate font-semibold tracking-tight">{companyName}</span>
          </Link>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Cerrar menú"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <SidebarNav role={user.role} onNavigate={closeMenu} />

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Monitor className="size-5 shrink-0" aria-hidden />
            Pantalla pública
            <ExternalLink className="ml-auto size-4 opacity-60" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            className="-ml-2 flex size-11 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink lg:hidden"
          >
            <Menu className="size-6" aria-hidden />
          </button>

          <span className="truncate font-semibold lg:hidden">{companyName}</span>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
            >
              {getInitials(user.name)}
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                aria-label="Cerrar sesión"
                className="h-10"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}