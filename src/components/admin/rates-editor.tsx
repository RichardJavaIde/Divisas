//src/components/admin/rates-editor.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlagIcon } from "@/components/ui/flag-icon";
import { Input } from "@/components/ui/input";
import { formatPercentChange } from "@/lib/format";
import { checkRatePair, percentChange, toInputValue } from "@/lib/rates";
import { cn } from "@/lib/utils";
import { saveRatesAction } from "@/server/actions/rate.actions";

export interface RateEditorItem {
  id: string;
  code: string;
  name: string;
  flagCode: string | null;
  isActive: boolean;
  buyRate: number;
  sellRate: number;
  /** ratesUpdatedAt en ISO: sirve para detectar cambios de otra persona. */
  version: string;
  updatedRelative: string;
  updatedExact: string;
}

type Draft = { buy: string; sell: string };
type Notice = { kind: "success" | "error"; message: string; stale?: boolean };

/** A partir de este cambio porcentual se muestra un aviso de verificación. */
const BIG_CHANGE_PERCENT = 10;

const initialDraft = (item: RateEditorItem): Draft => ({
  buy: toInputValue(item.buyRate),
  sell: toInputValue(item.sellRate),
});

const buildDrafts = (items: RateEditorItem[]): Record<string, Draft> =>
  Object.fromEntries(items.map((item) => [item.id, initialDraft(item)]));

function RateInput({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      {/* En pantallas pequeñas la etiqueta es visible; en grandes la da el encabezado */}
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted sm:sr-only">
        {label}
      </label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        invalid={Boolean(error)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="tabular text-right text-lg font-medium"
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-sell">
          {error}
        </p>
      )}
    </div>
  );
}

const ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_9rem_9rem]";

export function RatesEditor({ items }: { items: RateEditorItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState(() => buildDrafts(items));
  const [notice, setNotice] = useState<Notice | null>(null);

  // Cuando llegan datos nuevos del servidor (tras guardar o recargar),
  // los borradores se reinician con los valores vigentes.
  const signature = items.map((item) => `${item.id}:${item.version}`).join("|");
  const [seenSignature, setSeenSignature] = useState(signature);
  if (signature !== seenSignature) {
    setSeenSignature(signature);
    setDrafts(buildDrafts(items));
  }

  const rows = items.map((item) => {
    const draft = drafts[item.id] ?? initialDraft(item);
    const { buyRate, sellRate, errors } = checkRatePair(draft.buy, draft.sell);
    const invalid = Boolean(errors.buyRate || errors.sellRate);
    const changed = buyRate !== item.buyRate || sellRate !== item.sellRate;

    let jump = 0;
    if (changed && !invalid && buyRate !== null && sellRate !== null) {
      const buyJump = percentChange(item.buyRate, buyRate);
      const sellJump = percentChange(item.sellRate, sellRate);
      jump = Math.abs(buyJump) >= Math.abs(sellJump) ? buyJump : sellJump;
    }

    return { item, draft, errors, invalid, changed, jump };
  });

  const dirty = rows.filter((row) => row.changed);
  const hasUnsaved = dirty.length > 0;

  // Avisa al cerrar o recargar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  function updateField(id: string, field: keyof Draft, value: string) {
    setDrafts((previous) => ({
      ...previous,
      [id]: { ...(previous[id] ?? { buy: "", sell: "" }), [field]: value },
    }));
    setNotice(null);
  }

  function discard() {
    setDrafts(buildDrafts(items));
    setNotice(null);
  }

  function save() {
    if (pending || dirty.length === 0) return;

    if (dirty.some((row) => row.invalid)) {
      setNotice({ kind: "error", message: "Corrige los valores marcados antes de guardar." });
      return;
    }

    const payload = dirty.map((row) => ({
      id: row.item.id,
      buyRate: row.draft.buy,
      sellRate: row.draft.sell,
      version: row.item.version,
    }));

    setNotice(null);
    startTransition(async () => {
      const result = await saveRatesAction(payload);
      if (result.ok) {
        setNotice({
          kind: "success",
          message:
            result.changed === 0
              ? "No había cambios que guardar."
              : result.changed === 1
                ? "Se actualizó 1 tasa."
                : `Se actualizaron ${result.changed} tasas.`,
        });
      } else {
        setNotice({ kind: "error", message: result.error, stale: result.stale });
      }
    });
  }

  if (items.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="font-medium">No hay monedas registradas</p>
        <p className="mt-1 text-sm text-ink-muted">
          Un administrador debe crearlas primero en la sección Monedas.
        </p>
      </Card>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      {notice && (
        <Alert variant={notice.kind}>
          <p>{notice.message}</p>
          {notice.stale && (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-1.5 cursor-pointer font-medium underline underline-offset-2"
            >
              Recargar valores actuales
            </button>
          )}
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div
          className={cn(
            "hidden gap-4 border-b border-border-subtle bg-surface-muted px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-muted sm:grid",
            ROW_GRID,
          )}
        >
          <span>Moneda</span>
          <span className="text-right">Compra</span>
          <span className="text-right">Venta</span>
        </div>

        <ul aria-busy={pending} className="divide-y divide-border-subtle">
          {rows.map(({ item, draft, errors, invalid, changed, jump }) => (
            <li
              key={item.id}
              className={cn(
                "grid gap-3 px-4 py-4 sm:items-start sm:gap-4 sm:px-5",
                ROW_GRID,
                !item.isActive && "bg-surface-muted",
                changed && "bg-brand-50/70",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FlagIcon
                  code={item.flagCode}
                  className={cn("text-3xl", !item.isActive && "opacity-50")}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">{item.code}</span>
                    {!item.isActive && (
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        Inactiva
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-muted">{item.name}</p>
                  <p className="text-xs text-ink-muted" title={item.updatedExact}>
                    Actualizada {item.updatedRelative}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:contents">
                <RateInput
                  id={`buy-${item.id}`}
                  label="Compra"
                  value={draft.buy}
                  error={errors.buyRate}
                  onChange={(value) => updateField(item.id, "buy", value)}
                />
                <RateInput
                  id={`sell-${item.id}`}
                  label="Venta"
                  value={draft.sell}
                  error={errors.sellRate}
                  onChange={(value) => updateField(item.id, "sell", value)}
                />
              </div>

              {!invalid && Math.abs(jump) >= BIG_CHANGE_PERCENT && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 sm:col-span-3">
                  <TriangleAlert className="size-4 shrink-0" aria-hidden />
                  Cambio de {formatPercentChange(jump)} respecto a la tasa actual. Verifica que sea
                  correcto.
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm" aria-live="polite">
          {hasUnsaved ? (
            <span className="font-medium">
              {dirty.length} {dirty.length === 1 ? "moneda modificada" : "monedas modificadas"}
            </span>
          ) : (
            <span className="text-ink-muted">Sin cambios pendientes</span>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={discard}
            disabled={!hasUnsaved || pending}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="size-4" aria-hidden />
            Descartar
          </Button>
          <Button
            type="submit"
            loading={pending}
            disabled={!hasUnsaved}
            className="flex-1 sm:flex-none"
          >
            <Save className="size-4" aria-hidden />
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
}