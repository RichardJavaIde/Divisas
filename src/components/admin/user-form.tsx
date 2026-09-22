//src/components/admin/user-form.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { createUserAction, updateUserAction } from "@/server/actions/user.actions";
import type { UserRole } from "@/server/domain/types";
import type { UserFormState, UserFormValues } from "@/server/validation/user";

export interface UserFormInitial {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

type UserFormProps = { mode: "create" } | { mode: "edit"; user: UserFormInitial };

const initialState: UserFormState = {};

const EMPTY_VALUES: UserFormValues = { username: "", name: "", role: "OPERATOR" };

export function UserForm(props: UserFormProps) {
  const action =
    props.mode === "edit" ? updateUserAction.bind(null, props.user.id) : createUserAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  const initial: UserFormValues =
    props.mode === "edit"
      ? { name: props.user.name, role: props.user.role }
      : EMPTY_VALUES;

  // Tras un error, todo se conserva salvo las contraseñas (no se vuelven a mostrar)
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};

  return (
    <Card className="max-w-2xl p-5 sm:p-6">
      <form action={formAction} className="space-y-6">
        {state.error && <Alert>{state.error}</Alert>}

        {props.mode === "create" ? (
          <TextField
            name="username"
            label="Usuario"
            defaultValue={values.username}
            error={errors.username}
            hint="Solo minúsculas, números, punto, guion y guion bajo. No se puede cambiar después."
            required
            maxLength={32}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="username-display">Usuario</Label>
            <p id="username-display" className="text-sm text-ink-muted">
              @{props.user.username} · no se puede cambiar
            </p>
          </div>
        )}

        <TextField
          name="name"
          label="Nombre completo"
          defaultValue={values.name}
          error={errors.name}
          required
          maxLength={60}
          autoComplete="off"
        />

        {props.mode === "create" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="password"
              label="Contraseña"
              type="password"
              error={errors.password}
              hint="Mínimo 10 caracteres."
              required
              autoComplete="new-password"
            />
            <TextField
              name="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="role">Rol</Label>
          <Select id="role" name="role" defaultValue={values.role}>
            <option value="OPERATOR">Operador · tasas e historial</option>
            <option value="ADMIN">Administrador · acceso completo</option>
          </Select>
        </div>

        {props.mode === "edit" && (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={props.user.isActive}
              className="mt-0.5 size-5 cursor-pointer accent-brand-500"
            />
            <span>
              <span className="block text-sm font-medium">Cuenta activa</span>
              <span className="block text-sm text-ink-muted">
                Una cuenta inactiva no puede iniciar sesión.
              </span>
            </span>
          </label>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
          <Link href="/admin/users" className={buttonClasses({ variant: "secondary" })}>
            Cancelar
          </Link>
          <Button type="submit" loading={pending}>
            {props.mode === "create" ? "Crear usuario" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}