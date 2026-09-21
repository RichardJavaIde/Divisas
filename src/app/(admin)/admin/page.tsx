//src/app/(admin)/admin/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Clock, Coins, EyeOff, Monitor } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatRate, formatRelativeTime } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import type { RateHistoryRecord } from "@/server/domain/types";
import { formatAppDateTime } from "@/server/format";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export const metadata: Metadata = { title: "Panel administrativo" };

const RATE_GRID =
  "grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 sm:grid-cols-[1fr_7rem_7rem]";

function CurrencyBadge({ code }: { code: string }) {
  return (
    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
      {code}
    </span>
  );
}

function RateDelta({
  label,
  previous,
  next,
}: {
  label: string;
  previous: number | null;
  next: number;
}) {
  return (
    <span className="tabular whitespace-nowrap">
      {label}{" "}
      {previous !== null && previous !== next && (
        <>
          <span className="text-ink-muted line-through">{formatRate(previous)}</span>
          {" → "}
        </>
      )}
      <span className="font-medium">{formatRate(next)}</span>
    </span>
  );
}

function ChangeRow({ change }: { change: RateHistoryRecord }) {
  const isInitial = change.previousBuyRate === null;

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <CurrencyBadge code={change.currencyCode} />
        <time
          dateTime={change.changedAt.toISOString()}
          title={formatAppDateTime(change.changedAt)}
          className="text-xs text-ink-muted"
        >
          {formatRelativeTime(change.changedAt)}
        </time>
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        <RateDelta label="Compra" previous={change.previousBuyRate} next={change.newBuyRate} />
        <RateDelta label="Venta" previous={change.previousSellRate} next={change.newSellRate} />
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        {isInitial ? "Alta inicial" : "Actualización"} · {change.changedByName}
      </p>
    </li>
  );
}

export default async function AdminDashboardPage() {
  // Los layouts no se ejecutan de nuevo en cada navegación interna,
  // por eso cada página protegida valida la sesión por su cuenta.
  const user = await requireUser();
  const summary = await getDashboardSummary();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Resumen de las tasas y la actividad reciente."
        actions={
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            className={buttonClasses({ variant: "secondary" })}
          >
            <Monitor className="size-4" aria-hidden />
            Abrir pantalla pública
          </Link>
        }
      />

      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Monedas activas"
          value={summary.activeCurrencies.length}
          hint="Visibles en la pantalla pública"
          icon={Coins}
        />
        <StatCard
          label="Monedas inactivas"
          value={summary.inactiveCount}
          hint="Ocultas de la pantalla pública"
          icon={EyeOff}
        />
        <StatCard
          label="Cambios en 24 horas"
          value={summary.changesLast24h}
          hint="Actualizaciones de tasas"
          icon={Activity}
        />
        <StatCard
          label="Última actualización"
          value={summary.lastRatesUpdate ? formatRelativeTime(summary.lastRatesUpdate) : "—"}
          hint={summary.lastRatesUpdate ? formatAppDateTime(summary.lastRatesUpdate) : undefined}
          icon={Clock}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3">
          <CardHeader
            title="Tasas actuales"
            description="Lo que se muestra hoy en la pantalla pública."
            action={
              <Link
                href="/admin/rates"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Gestionar <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />

          {summary.activeCurrencies.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              No hay monedas activas todavía.
            </p>
          ) : (
            <>
              <div
                className={`${RATE_GRID} border-b border-border-subtle bg-surface-muted px-5 py-2 text-xs font-medium uppercase tracking-wide text-ink-muted`}
              >
                <span>Moneda</span>
                <span className="text-right">Compra</span>
                <span className="text-right">Venta</span>
              </div>
              <ul className="divide-y divide-border-subtle">
                {summary.activeCurrencies.map((currency) => (
                  <li key={currency.id} className={`${RATE_GRID} px-5 py-3`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <CurrencyBadge code={currency.code} />
                      <span className="truncate text-sm text-ink-muted">{currency.name}</span>
                    </div>
                    <span className="tabular text-right font-medium">
                      {formatRate(currency.buyRate)}
                    </span>
                    <span className="tabular text-right font-medium">
                      {formatRate(currency.sellRate)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title="Últimos cambios"
            action={
              <Link
                href="/admin/history"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Ver todo <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />

          {summary.recentChanges.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              Aún no hay cambios registrados.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {summary.recentChanges.map((change) => (
                <ChangeRow key={change.id} change={change} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}