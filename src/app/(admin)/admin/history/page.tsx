//src/app/(admin)/admin/history/page.tsx
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, History as HistoryIcon } from "lucide-react";
import { HistoryFilters } from "@/components/admin/history-filters";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { Card } from "@/components/ui/card";
import { formatRate } from "@/lib/format";
import { HISTORY_PAGE_SIZE, HISTORY_PERIODS } from "@/lib/history";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import type { RateHistoryRecord } from "@/server/domain/types";
import { formatAppDateTime } from "@/server/format";
import { listCurrencies } from "@/server/services/currency.service";
import { getHistory } from "@/server/services/history.service";

export const metadata: Metadata = { title: "Historial" };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// Tabla en pantallas muy anchas; tarjetas apiladas en el resto
const GRID =
  "xl:grid xl:grid-cols-[9.5rem_4.5rem_minmax(0,1fr)_minmax(0,1fr)_11rem] xl:items-center xl:gap-x-4";

function CurrencyBadge({ code }: { code: string }) {
  return (
    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
      {code}
    </span>
  );
}

function RateCell({
  label,
  previous,
  next,
}: {
  label: string;
  previous: number | null;
  next: number;
}) {
  const delta = previous === null ? 0 : next - previous;

  return (
    <div className="tabular min-w-0 text-sm">
      <p className="text-xs text-ink-muted xl:hidden">{label}</p>
      <p>
        {previous !== null && delta !== 0 && (
          <>
            <span className="text-ink-muted line-through">{formatRate(previous)}</span>
            <span className="mx-1 text-ink-muted" aria-hidden>
              →
            </span>
          </>
        )}
        <span className="font-semibold">{formatRate(next)}</span>
      </p>

      {previous === null ? (
        <p className="text-xs text-ink-muted">Valor inicial</p>
      ) : delta === 0 ? (
        <p className="text-xs text-ink-muted">Sin cambio</p>
      ) : (
        <p
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            delta > 0 ? "text-green-700" : "text-red-700",
          )}
        >
          {delta > 0 ? (
            <ArrowUp className="size-3" aria-hidden />
          ) : (
            <ArrowDown className="size-3" aria-hidden />
          )}
          <span className="sr-only">{delta > 0 ? "Sube " : "Baja "}</span>
          {formatRate(Math.abs(delta))}
        </p>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: RateHistoryRecord }) {
  const isInitial = entry.previousBuyRate === null;

  return (
    <li className={cn("space-y-3 px-4 py-4 sm:px-5 xl:space-y-0", GRID)}>
      <div className="flex items-center justify-between gap-3 xl:block">
        <time dateTime={entry.changedAt.toISOString()} className="tabular text-sm">
          {formatAppDateTime(entry.changedAt)}
        </time>
        <span className="xl:hidden">
          <CurrencyBadge code={entry.currencyCode} />
        </span>
      </div>

      <div className="hidden xl:block">
        <CurrencyBadge code={entry.currencyCode} />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:contents">
        <RateCell label="Compra" previous={entry.previousBuyRate} next={entry.newBuyRate} />
        <RateCell label="Venta" previous={entry.previousSellRate} next={entry.newSellRate} />
      </div>

      <div className="text-sm">
        <p className="truncate font-medium">{entry.changedByName}</p>
        <p className="text-xs text-ink-muted">{isInitial ? "Alta inicial" : "Actualización"}</p>
      </div>
    </li>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();

  const params = await searchParams;
  const currencies = await listCurrencies();

  // Todo lo que llega por la URL se valida: un valor desconocido se ignora
  const currency = currencies.find((c) => c.id === first(params.currency));
  const period = HISTORY_PERIODS.find((p) => p.value === first(params.period))?.value ?? "all";
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), 100_000)
    : 1;

  const history = await getHistory({ currencyId: currency?.id, period, page });

  function buildHref(target: number) {
    const query = new URLSearchParams();
    if (currency) query.set("currency", currency.id);
    if (period !== "all") query.set("period", period);
    if (target > 1) query.set("page", String(target));
    const search = query.toString();
    return search ? `/admin/history?${search}` : "/admin/history";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial"
        description="Quién cambió cada tasa, cuándo y cuál era el valor anterior."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle p-4 sm:px-5">
          <HistoryFilters
            currencies={currencies.map((c) => ({ id: c.id, code: c.code, name: c.name }))}
            currencyId={currency?.id ?? ""}
            period={period}
          />
        </div>

        {history.items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <HistoryIcon className="size-6" aria-hidden />
            </span>
            <p className="mt-4 font-medium">No hay cambios para mostrar</p>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Prueba con otra moneda o con un período más amplio.
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "hidden border-b border-border-subtle bg-surface-muted px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-muted",
                GRID,
              )}
            >
              <span>Fecha y hora</span>
              <span>Moneda</span>
              <span>Compra</span>
              <span>Venta</span>
              <span>Usuario</span>
            </div>

            <ul className="divide-y divide-border-subtle">
              {history.items.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))}
            </ul>

            <Pagination
              page={history.page}
              totalPages={history.totalPages}
              total={history.total}
              pageSize={HISTORY_PAGE_SIZE}
              buildHref={buildHref}
            />
          </>
        )}
      </Card>
    </div>
  );
}