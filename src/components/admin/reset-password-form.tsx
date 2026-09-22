//src/components/admin/reset-password-form.tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { resetPasswordAction } from "@/server/actions/user.actions";
import type { PasswordFormState } from "@/server/validation/user";

const initialState: PasswordFormState = {};

export function ResetPasswordForm({ userId }: { userId: string }) {
  const action = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Tras guardar, los campos se limpian (no queda la contraseña escrita en pantalla)
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.success && <Alert variant="success">Contraseña actualizada.</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="password"
          label="Nueva contraseña"
          type="password"
          error={state.fieldErrors?.password}
          hint="Mínimo 10 caracteres."
          required
          autoComplete="new-password"
        />
        <TextField
          name="confirmPassword"
          label="Confirmar contraseña"
          type="password"
          error={state.fieldErrors?.confirmPassword}
          required
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" variant="secondary" loading={pending}>
        Restablecer contraseña
      </Button>
    </form>
  );
}