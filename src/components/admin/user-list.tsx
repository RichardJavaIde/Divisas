//src/components/admin/user-list.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Users as UsersIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setUserActiveAction } from "@/server/actions/user.actions";
import type { UserRole } from "@/server/domain/types";
import type { ActionResult } from "@/server/validation/user";

export interface UserListItem {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null; // ISO, o null si nunca ha entrado
}

const ROLE_LABELS: Record<UserRole, string> = { ADMIN: "Administrador", OPERATOR: "Operador" };

export function UserList({
  users,
  currentUserId,
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  if (users.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <UsersIcon className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-medium">Aún no hay usuarios</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <ul
          aria-busy={pending}
          className={cn("divide-y divide-border-subtle transition-opacity", pending && "opacity-70")}
        >
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <li
                key={user.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                  !user.isActive && "bg-surface-muted",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{user.name}</span>
                    {isSelf && (
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                        Tú
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        Inactivo
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-muted">@{user.username}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4 sm:gap-6">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      user.role === "ADMIN"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>

                  <span className="hidden w-36 text-xs text-ink-muted lg:inline">
                    {user.lastLoginAt
                      ? `Ingresó ${formatRelativeTime(new Date(user.lastLoginAt))}`
                      : "Nunca ha ingresado"}
                  </span>

                  <Switch
                    checked={user.isActive}
                    disabled={pending}
                    label={`${user.isActive ? "Desactivar" : "Activar"} a ${user.name}`}
                    onCheckedChange={(value) => run(() => setUserActiveAction(user.id, value))}
                  />

                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    aria-label={`Editar ${user.name}`}
                    title="Editar"
                    className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2.5 sm:px-3" })}
                  >
                    <Pencil className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Editar</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-sm text-ink-muted">
        Debe quedar al menos un administrador activo: si intentas desactivar o cambiar el rol del
        único administrador, el sistema lo rechaza.
      </p>
    </div>
  );
}