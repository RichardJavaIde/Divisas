//src/components/admin/history-filters.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HISTORY_PERIODS } from "@/lib/history";

export function HistoryFilters({
  currencies,
  currencyId,
  period,
}: {
  currencies: { id: string; code: string; name: string }[];
  currencyId: string;
  period: string;
}) {
  const router = useRouter();

  // Al cambiar un filtro se vuelve a la página 1
  function go(next: { currencyId: string; period: string }) {
    const query = new URLSearchParams();
    if (next.currencyId) query.set("currency", next.currencyId);
    if (next.period !== "all") query.set("period", next.period);
    const search = query.toString();
    router.push(search ? `/admin/history?${search}` : "/admin/history");
  }

  const active = currencyId !== "" || period !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5 sm:w-60">
        <Label htmlFor="filter-currency">Moneda</Label>
        <Select
          id="filter-currency"
          value={currencyId}
          onChange={(event) => go({ currencyId: event.target.value, period })}
        >
          <option value="">Todas las monedas</option>
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.code} · {currency.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5 sm:w-52">
        <Label htmlFor="filter-period">Período</Label>
        <Select
          id="filter-period"
          value={period}
          onChange={(event) => go({ currencyId, period: event.target.value })}
        >
          {HISTORY_PERIODS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {active && (
        <Link href="/admin/history" className={buttonClasses({ variant: "ghost" })}>
          <X className="size-4" aria-hidden />
          Limpiar
        </Link>
      )}
    </div>
  );
}