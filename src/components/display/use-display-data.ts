//src/components/display/use-display-data.ts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  clampRefreshSeconds,
  diffRates,
  isDisplayData,
  type DisplayData,
  type RateMoves,
} from "@/lib/display";

const ENDPOINT = "/api/display";
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_MS = 10_000; // cada cuánto reintenta mientras no hay conexión
const HIGHLIGHT_MS = 30_000; // cuánto dura la flecha de "sube/baja"
const RELOAD_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * Mantiene los datos al día. Si una consulta falla conserva los últimos datos,
 * marca la pantalla como "sin conexión" y reintenta hasta recuperarse.
 */
export function useDisplayData(initial: DisplayData) {
  const [data, setData] = useState(initial);
  const [online, setOnline] = useState(true);
  const [moves, setMoves] = useState<RateMoves>({});

  const latest = useRef(initial);
  const refreshMs = useRef(clampRefreshSeconds(initial.refreshSeconds) * 1000);

  useEffect(() => {
    const startedAt = Date.now();
    let stopped = false;
    let failures = 0;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;

    function schedule(delay: number) {
      if (stopped) return;
      clearTimeout(pollTimer);
      pollTimer = setTimeout(poll, delay);
    }

    async function poll() {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(ENDPOINT, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const next: unknown = await response.json();
        if (!isDisplayData(next)) throw new Error("Respuesta inválida");
        if (stopped) return;

        failures = 0;
        refreshMs.current = clampRefreshSeconds(next.refreshSeconds) * 1000;

        const changes = diffRates(latest.current.currencies, next.currencies);
        latest.current = next;
        setData(next);
        setOnline(true);

        if (Object.keys(changes).length > 0) {
          setMoves((previous) => ({ ...previous, ...changes }));
          clearTimeout(highlightTimer);
          highlightTimer = setTimeout(() => setMoves({}), HIGHLIGHT_MS);
        }

        // Recarga preventiva: solo después de una respuesta correcta,
        // para no dejar la pantalla en la página de error del navegador.
        if (Date.now() - startedAt > RELOAD_AFTER_MS) window.location.reload();
      } catch {
        if (stopped) return;
        failures += 1;
        setOnline(false);
      } finally {
        clearTimeout(abortTimer);
        schedule(failures === 0 ? refreshMs.current : Math.min(refreshMs.current, RETRY_MS));
      }
    }

    // Los navegadores frenan los temporizadores en segundo plano: al volver, se consulta ya
    const refreshNow = () => {
      if (document.visibilityState === "visible") schedule(0);
    };

    schedule(refreshMs.current);
    window.addEventListener("online", refreshNow);
    document.addEventListener("visibilitychange", refreshNow);

    return () => {
      stopped = true;
      clearTimeout(pollTimer);
      clearTimeout(highlightTimer);
      window.removeEventListener("online", refreshNow);
      document.removeEventListener("visibilitychange", refreshNow);
    };
  }, []);

  return { data, online, moves };
}