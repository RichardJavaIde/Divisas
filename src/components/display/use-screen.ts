//src/components/display/use-screen.ts
"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** true cuando no hubo actividad del mouse, teclado o toque durante `timeoutMs`. */
export function useIdle(timeoutMs: number): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeoutMs);
    };
    const wake = () => {
      setIdle(false);
      arm();
    };

    const events = ["mousemove", "pointerdown", "touchstart", "keydown"] as const;
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    arm();

    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, wake));
    };
  }, [timeoutMs]);

  return idle;
}

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
};
const subscribeNothing = () => () => {};

export function useFullscreen() {
  const active = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const supported = useSyncExternalStore(
    subscribeNothing,
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* el navegador puede rechazarlo si no hubo un gesto del usuario */
    }
  }, []);

  return { active, supported, toggle };
}

/** Evita que la pantalla se apague. Requiere HTTPS o localhost; si no, se ignora. */
export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        /* sin permiso o sin contexto seguro */
      }
    };
    // El bloqueo se pierde al ocultar la pestaña: se vuelve a pedir al regresar
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, []);
}

/** Índice de la página actual. Avanza cada `seconds` si hay más de una página. */
export function useRotation(count: number, seconds: number): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setTick((value) => value + 1), seconds * 1000);
    return () => clearInterval(id);
  }, [count, seconds]);

  return count > 0 ? tick % count : 0;
}