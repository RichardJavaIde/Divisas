//src/components/admin/company-settings-form.tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { 
  MAX_ROTATION_SECONDS, MAX_ROWS_PER_PAGE, MIN_ROTATION_SECONDS, MIN_ROWS_PER_PAGE,MAX_REFRESH_SECONDS, MIN_REFRESH_SECONDS } from "@/lib/display";
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
    <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="rowsPerPage"
          label="Monedas por pantalla"
          defaultValue={values.rowsPerPage}
          error={errors.rowsPerPage}
          hint={`Filas que caben en una página (${MIN_ROWS_PER_PAGE} a ${MAX_ROWS_PER_PAGE}).`}
          required
          type="number"
          inputMode="numeric"
          min={MIN_ROWS_PER_PAGE}
          max={MAX_ROWS_PER_PAGE}
        />

        <TextField
          name="rotationSeconds"
          label="Segundos entre páginas"
          defaultValue={values.rotationSeconds}
          error={errors.rotationSeconds}
          hint={`Solo aplica si hay más monedas que las mostradas por página (${MIN_ROTATION_SECONDS} a ${MAX_ROTATION_SECONDS}).`}
          required
          type="number"
          inputMode="numeric"
          min={MIN_ROTATION_SECONDS}
          max={MAX_ROTATION_SECONDS}
        />
      </div>
      <div className="border-t border-border-subtle pt-5">
        <Button type="submit" loading={pending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}