//src/components/display/rate-row.tsx
import { ArrowDown, ArrowUp } from "lucide-react";
import { FlagIcon } from "@/components/ui/flag-icon";
import type { DisplayCurrency, Move, RateMove, RowMetrics } from "@/lib/display";
import { cn } from "@/lib/utils";
import { ROW_GRID_STYLE, u } from "./layout";

function RateCell({ text, move, size }: { text: string; move: Move; size: number }) {
  return (
    <div className="relative flex items-center justify-end">
      {move !== 0 && (
        <span
          role="img"
          aria-label={move > 0 ? "Sube" : "Baja"}
          className={cn(
            "absolute left-0 flex items-center justify-center rounded-full",
            move > 0 ? "bg-green-400/15 text-green-400" : "bg-red-400/15 text-red-400",
          )}
          style={{ width: u(3.6), height: u(3.6) }}
        >
          {move > 0 ? (
            <ArrowUp style={{ width: u(2.4), height: u(2.4) }} />
          ) : (
            <ArrowDown style={{ width: u(2.4), height: u(2.4) }} />
          )}
        </span>
      )}
      <span className="tabular font-bold leading-none" style={{ fontSize: u(size) }}>
        {text}
      </span>
    </div>
  );
}

export function RateRow({
  currency,
  metrics,
  move,
}: {
  currency: DisplayCurrency;
  metrics: RowMetrics;
  move?: RateMove;
}) {
  return (
    <li
      className={cn(
        "grid items-center border-b border-white/10 last:border-b-0",
        move && "display-flash",
      )}
      style={ROW_GRID_STYLE}
    >
      <div className="flex min-w-0 items-center" style={{ gap: u(2.5) }}>
        {/* El tamaño de la bandera lo define el font-size de su contenedor */}
        <span className="flex shrink-0 leading-none" style={{ fontSize: u(metrics.flag) }}>
          <FlagIcon
            code={currency.flagCode}
            className="rounded-[0.1em] shadow-lg shadow-black/40 ring-1 ring-white/10"
          />
        </span>

        <div className="min-w-0">
          <p
            className="flex items-baseline font-bold leading-none tracking-tight"
            style={{ fontSize: u(metrics.code), gap: "0.35em" }}
          >
            {currency.code}
            {currency.symbol && (
              <span className="font-medium text-brand-300" style={{ fontSize: "0.55em" }}>
                {currency.symbol}
              </span>
            )}
          </p>
          <p
            className="line-clamp-2 leading-tight text-brand-200"
            style={{ fontSize: u(metrics.name), marginTop: u(0.6) }}
          >
            {currency.name}
          </p>
        </div>
      </div>

      <RateCell text={currency.buyText} move={move?.buy ?? 0} size={metrics.rate} />
      <RateCell text={currency.sellText} move={move?.sell ?? 0} size={metrics.rate} />
    </li>
  );
}