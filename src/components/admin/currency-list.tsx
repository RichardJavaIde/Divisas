//src/components/admin/currency-list.tsx
"use client";

import { useMemo, useState, useTransition, type ComponentProps } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Coins, Pencil, Plus, Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlagIcon } from "@/components/ui/flag-icon";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  moveCurrencyAction,
  setCurrencyActiveAction,
} from "@/server/actions/currency.actions";
import type { ActionResult } from "@/server/validation/currency";

export interface CurrencyListItem {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  flagCode: string | null;
  buyRate: number;
  sellRate: number;
  isActive: boolean;
}

/** Sin tildes y en minúsculas, para que "dolar" encuentre "Dólar". */
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function IconButton({
  label,
  className,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors sm:size-8",
        "hover:bg-slate-100 hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export function CurrencyList({ currencies }: { currencies: CurrencyListItem[] }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const term = normalize(query.trim());
  const filtering = term.length > 0;

  const visible = useMemo(
    () =>
      filtering
        ? currencies.filter((c) => normalize(`${c.code} ${c.name}`).includes(term))
        : currencies,
    [currencies, filtering, term],
  );

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  if (currencies.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Coins className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-medium">Aún no hay monedas</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Crea la primera para que aparezca en la pantalla pública.
        </p>
        <Link href="/admin/currencies/new" className={buttonClasses({ className: "mt-5" })}>
          <Plus className="size-4" aria-hidden />
          Nueva moneda
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código o nombre"
              aria-label="Buscar monedas"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {filtering
              ? `${visible.length} de ${currencies.length} monedas`
              : `${currencies.length} ${currencies.length === 1 ? "moneda" : "monedas"}`}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-muted">
            Sin resultados para «{query.trim()}».
          </p>
        ) : (
          <ul
            aria-busy={pending}
            className={cn("divide-y divide-border-subtle transition-opacity", pending && "opacity-70")}
          >
            {visible.map((c, index) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5",
                  !c.isActive && "bg-surface-muted",
                )}
              >
                <div className="flex shrink-0 flex-col">
                  <IconButton
                    label={`Subir ${c.code}`}
                    disabled={filtering || pending || index === 0}
                    onClick={() => run(() => moveCurrencyAction(c.id, "up"))}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={`Bajar ${c.code}`}
                    disabled={filtering || pending || index === currencies.length - 1}
                    onClick={() => run(() => moveCurrencyAction(c.id, "down"))}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </IconButton>
                </div>

                <FlagIcon code={c.flagCode} className={cn("text-2xl", !c.isActive && "opacity-50")} />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">{c.code}</span>
                    {c.symbol && <span className="text-sm text-ink-muted">{c.symbol}</span>}
                    {!c.isActive && (
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        Inactiva
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-muted">{c.name}</p>
                  <p className="tabular mt-1 text-xs text-ink-muted md:hidden">
                    Compra {formatRate(c.buyRate)} · Venta {formatRate(c.sellRate)}
                  </p>
                </div>

                <dl className="tabular hidden shrink-0 grid-cols-2 gap-6 text-right md:grid">
                  <div className="min-w-[5.5rem]">
                    <dt className="text-xs text-ink-muted">Compra</dt>
                    <dd className="font-medium">{formatRate(c.buyRate)}</dd>
                  </div>
                  <div className="min-w-[5.5rem]">
                    <dt className="text-xs text-ink-muted">Venta</dt>
                    <dd className="font-medium">{formatRate(c.sellRate)}</dd>
                  </div>
                </dl>

                <Switch
                  checked={c.isActive}
                  disabled={pending}
                  label={`${c.isActive ? "Desactivar" : "Activar"} ${c.code}`}
                  onCheckedChange={(value) => run(() => setCurrencyActiveAction(c.id, value))}
                />

                <Link
                  href={`/admin/currencies/${c.id}/edit`}
                  aria-label={`Editar ${c.code}`}
                  title={`Editar ${c.code}`}
                  className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2.5 sm:px-3" })}
                >
                  <Pencil className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Editar</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-ink-muted">
        El orden de esta lista es el de la pantalla pública. Las monedas inactivas no se muestran allí.
        {filtering && " Borra la búsqueda para poder reordenar."}
      </p>
    </div>
  );
}