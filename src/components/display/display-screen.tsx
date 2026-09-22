//src/components/display/display-screen.tsx
"use client";

import { useEffect } from "react";
import { Maximize, Minimize, WifiOff } from "lucide-react";
import { getRowMetrics, paginate, type DisplayData,} from "@/lib/display";
import { cn } from "@/lib/utils";
import { Clock } from "./clock";
import { ROW_GRID_STYLE, u } from "./layout";
import { Logo } from "./logo";
import { RateRow } from "./rate-row";
import { useDisplayData } from "./use-display-data";
import { useFullscreen, useIdle, useRotation, useWakeLock } from "./use-screen";

export function DisplayScreen({ initialData }: { initialData: DisplayData }) {
  const { data, online, moves } = useDisplayData(initialData);
  const idle = useIdle(3_000);
  const fullscreen = useFullscreen();
  const toggleFullscreen = fullscreen.toggle;
  useWakeLock();

  const { pageCount, perPage } = paginate(data.currencies.length, data.rowsPerPage);
  const page = useRotation(pageCount, data.rotationSeconds);
  const visible = data.currencies.slice(page * perPage, (page + 1) * perPage);

  // El tamaño del número se calcula con el valor más largo de TODAS las páginas,
  // así no cambia de una página a otra.
  const longestRate = data.currencies.reduce(
    (max, currency) => Math.max(max, currency.buyText.length, currency.sellText.length),
    0,
  );
  const metrics = getRowMetrics(perPage, longestRate);

  // Tecla F: pantalla completa
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F") void toggleFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  return (
    <div
      className={cn(
        "display-screen fixed inset-0 select-none overflow-hidden bg-brand-950 text-white",
        idle && "cursor-none",
      )}
    >
      <div
        className="mx-auto flex h-full flex-col bg-linear-to-b from-brand-950 via-brand-900 to-brand-950"
        style={{ width: u(100), maxWidth: "100%" }}
      >
        {/* Encabezado */}
        <header
          className="flex shrink-0 items-center justify-between"
          style={{ height: u(16), paddingInline: u(4), gap: u(3) }}
        >
          <div className="flex min-w-0 items-center" style={{ gap: u(2.5) }}>
            <Logo url={data.logoUrl} name={data.companyName} />
            <h1 className="truncate font-bold tracking-tight" style={{ fontSize: u(4.4) }}>
              {data.companyName}
            </h1>
          </div>
          <Clock seedIso={initialData.generatedAt} timeZone={data.timeZone} />
        </header>

        {/* Títulos de columna */}
        <div
          className="grid shrink-0 items-center border-y border-white/10 bg-white/5 font-semibold uppercase tracking-[0.18em] text-brand-200"
          style={{ ...ROW_GRID_STYLE, height: u(5.5), fontSize: u(2.2) }}
        >
          <span>Moneda</span>
          <span className="flex items-center justify-end" style={{ gap: u(1) }}>
            <span
              aria-hidden
              className="rounded-full bg-green-400"
              style={{ width: u(1.2), height: u(1.2) }}
            />
            Compra
          </span>
          <span className="flex items-center justify-end" style={{ gap: u(1) }}>
            <span
              aria-hidden
              className="rounded-full bg-red-400"
              style={{ width: u(1.2), height: u(1.2) }}
            />
            Venta
          </span>
        </div>

        {/* Tasas */}
        {data.currencies.length === 0 ? (
          <div
            className="flex flex-1 items-center justify-center text-center text-brand-200"
            style={{ fontSize: u(3.4), padding: u(6) }}
          >
            Tasas no disponibles por el momento
          </div>
        ) : (
          <ul
            key={page}
            className={cn("grid min-h-0 flex-1", pageCount > 1 && "display-fade")}
            style={{ gridTemplateRows: `repeat(${perPage}, minmax(0, 1fr))` }}
          >
            {visible.map((currency) => (
              <RateRow
                key={currency.id}
                currency={currency}
                metrics={metrics}
                move={moves[currency.id]}
              />
            ))}
          </ul>
        )}

        {/* Pie */}
        <footer
          className="flex shrink-0 items-center justify-between border-t border-white/10"
          style={{
            minHeight: u(8),
            paddingInline: u(4),
            paddingBlock: u(1.5),
            gap: u(3),
            fontSize: u(2),
          }}
        >
          <p className="line-clamp-2 min-w-0 flex-1 leading-snug text-brand-200">
            {data.footerNote}
          </p>

          {pageCount > 1 && (
            <div
              role="img"
              aria-label={`Página ${page + 1} de ${pageCount}`}
              className="flex shrink-0 items-center"
              style={{ gap: u(1) }}
            >
              {Array.from({ length: pageCount }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "rounded-full transition-colors",
                    index === page ? "bg-white" : "bg-white/25",
                  )}
                  style={{ width: u(1.3), height: u(1.3) }}
                />
              ))}
            </div>
          )}

          <div className="shrink-0 text-right">
            {online ? (
              data.ratesUpdatedText && (
                <p suppressHydrationWarning className="text-brand-300">
                  Actualizado: {data.ratesUpdatedText}
                </p>
              )
            ) : (
              <p
                role="status"
                className="inline-flex items-center rounded-full bg-amber-400/15 font-medium text-amber-300"
                style={{ gap: "0.5em", paddingInline: "0.9em", paddingBlock: "0.3em" }}
              >
                <WifiOff style={{ width: "1.1em", height: "1.1em" }} aria-hidden />
                Sin conexión · últimas tasas guardadas
              </p>
            )}
          </div>
        </footer>
      </div>

      {/* Botón de pantalla completa: aparece al mover el mouse */}
      {fullscreen.supported && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          tabIndex={idle ? -1 : 0}
          aria-label={fullscreen.active ? "Salir de pantalla completa" : "Pantalla completa"}
          title={fullscreen.active ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"}
          className={cn(
            "fixed right-4 top-4 z-10 flex size-12 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-opacity hover:bg-black/70",
            idle ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          {fullscreen.active ? (
            <Minimize className="size-5" aria-hidden />
          ) : (
            <Maximize className="size-5" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}