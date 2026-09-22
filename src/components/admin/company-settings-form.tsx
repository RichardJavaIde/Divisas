//src/components/admin/company-settings-form.tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MAX_REFRESH_SECONDS, MIN_REFRESH_SECONDS } from "@/lib/display";
import { updateCompanySettingsAction } from "@/server/actions/settings.actions";
import type { SettingsFormState, SettingsFormValues } from "@/server/validation/settings";

const initialState: SettingsFormState = {};

export function CompanySettingsForm({ initial }: { initial: SettingsFormValues }) {
  const [state, formAction, pending] = useActionState(updateCompanySettingsAction, initialState);
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};

  // El mensaje de éxito se oculta solo tras unos segundos
  const successTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(successTimer.current), []);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.success && <Alert variant="success">Cambios guardados.</Alert>}

      <TextField
        name="companyName"
        label="Nombre de la compañía"
        defaultValue={values.companyName}
        error={errors.companyName}
        hint="Se muestra en el panel, el inicio de sesión y la pantalla pública."
        required
        maxLength={60}
        autoComplete="off"
      />

      <TextField
        name="footerNote"
        label="Nota del pie"
        optional
        defaultValue={values.footerNote}
        error={errors.footerNote}
        hint="Texto breve al final de la pantalla pública. Déjalo vacío para no mostrar nada."
        maxLength={160}
        autoComplete="off"
      />

      <TextField
        name="refreshSeconds"
        label="Actualización de la pantalla pública"
        defaultValue={values.refreshSeconds}
        error={errors.refreshSeconds}
        hint={`Cada cuántos segundos se consultan las tasas (${MIN_REFRESH_SECONDS} a ${MAX_REFRESH_SECONDS}).`}
        required
        type="number"
        inputMode="numeric"
        min={MIN_REFRESH_SECONDS}
        max={MAX_REFRESH_SECONDS}
      />

      <div className="border-t border-border-subtle pt-5">
        <Button type="submit" loading={pending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}