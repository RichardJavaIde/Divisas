//src/components/admin/currency-form.tsx
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlagIcon } from "@/components/ui/flag-icon";
import { TextField } from "@/components/ui/text-field";
import { formatRate } from "@/lib/format";
import {
  createCurrencyAction,
  updateCurrencyAction,
} from "@/server/actions/currency.actions";
import type { CurrencyFormState, CurrencyFormValues } from "@/server/validation/currency";

export interface CurrencyFormInitial {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  flagCode: string | null;
  buyRate: number;
  sellRate: number;
}

type CurrencyFormProps =
  | { mode: "create" }
  | { mode: "edit"; currency: CurrencyFormInitial };

const initialState: CurrencyFormState = {};

const EMPTY_VALUES: CurrencyFormValues = {
  code: "",
  name: "",
  symbol: "",
  flagCode: "",
  buyRate: "",
  sellRate: "",
  isActive: "on",
};

export function CurrencyForm(props: CurrencyFormProps) {
  const action =
    props.mode === "edit"
      ? updateCurrencyAction.bind(null, props.currency.id)
      : createCurrencyAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  const initial: CurrencyFormValues =
    props.mode === "edit"
      ? {
          ...EMPTY_VALUES,
          code: props.currency.code,
          name: props.currency.name,
          symbol: props.currency.symbol ?? "",
          flagCode: props.currency.flagCode ?? "",
        }
      : EMPTY_VALUES;

  // Tras un error el formulario se conserva con lo que escribió el usuario
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};

  const [flag, setFlag] = useState(values.flagCode ?? "");

  return (
    <Card className="max-w-2xl p-5 sm:p-6">
      <form action={formAction} className="space-y-6">
        {state.error && <Alert>{state.error}</Alert>}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="code"
            label="Código"
            defaultValue={values.code}
            error={errors.code}
            hint="Ej. USD, EUR, GBP"
            required
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            autoFocus={props.mode === "create"}
            className="uppercase"
          />
          <TextField
            name="name"
            label="Nombre"
            defaultValue={values.name}
            error={errors.name}
            hint="Ej. Dólar estadounidense"
            required
            maxLength={60}
            autoComplete="off"
          />
          <TextField
            name="symbol"
            label="Símbolo"
            optional
            defaultValue={values.symbol}
            error={errors.symbol}
            hint="Ej. $, €, £"
            maxLength={5}
            autoComplete="off"
          />
          <TextField
            name="flagCode"
            label="Bandera"
            optional
            defaultValue={values.flagCode}
            error={errors.flagCode}
            hint="Código de país de 2 letras: us, eu, gb, do…"
            maxLength={2}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setFlag(event.target.value.trim().toLowerCase())}
            trailing={<FlagIcon code={flag} />}
          />
        </div>

        {props.mode === "create" ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="buyRate"
                label="Precio de compra"
                defaultValue={values.buyRate}
                error={errors.buyRate}
                hint="Lo que paga la casa de cambio"
                required
                inputMode="decimal"
                autoComplete="off"
              />
              <TextField
                name="sellRate"
                label="Precio de venta"
                defaultValue={values.sellRate}
                error={errors.sellRate}
                hint="Lo que cobra la casa de cambio"
                required
                inputMode="decimal"
                autoComplete="off"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={values.isActive === "on"}
                className="mt-0.5 size-5 cursor-pointer accent-brand-500"
              />
              <span>
                <span className="block text-sm font-medium">Mostrar en la pantalla pública</span>
                <span className="block text-sm text-ink-muted">
                  Puedes activarla o desactivarla después desde el listado.
                </span>
              </span>
            </label>
          </>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
            <p className="text-ink-muted">Tasas actuales</p>
            <p className="tabular mt-0.5 font-medium">
              Compra {formatRate(props.currency.buyRate)} · Venta{" "}
              {formatRate(props.currency.sellRate)}
            </p>
            <p className="mt-1 text-ink-muted">
              Para cambiarlas usa la sección{" "}
              <Link href="/admin/rates" className="font-medium text-brand-600 hover:text-brand-700">
                Tasas
              </Link>
              , así queda registrado en el historial.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
          <Link href="/admin/currencies" className={buttonClasses({ variant: "secondary" })}>
            Cancelar
          </Link>
          <Button type="submit" loading={pending}>
            {props.mode === "create" ? "Crear moneda" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}