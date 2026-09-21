//src/components/display/clock.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import { u } from "./layout";

/** Hora y fecha del dispositivo, en la zona horaria configurada (APP_TIMEZONE). */
export function Clock({ seedIso, timeZone }: { seedIso: string; timeZone: string | null }) {
  // Se parte de la hora del servidor para que el primer render coincida con el HTML inicial
  const [now, setNow] = useState(() => Date.parse(seedIso));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formats = useMemo(() => {
    const zone = timeZone ?? undefined;
    return {
      time: new Intl.DateTimeFormat(siteConfig.locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: zone,
      }),
      date: new Intl.DateTimeFormat(siteConfig.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: zone,
      }),
    };
  }, [timeZone]);

  const value = new Date(now);

  return (
    <div className="shrink-0 text-right">
      <p
        suppressHydrationWarning
        className="tabular font-bold leading-none"
        style={{ fontSize: u(5.4) }}
      >
        {formats.time.format(value)}
      </p>
      <p
        suppressHydrationWarning
        className="capitalize text-brand-200"
        style={{ marginTop: u(1), fontSize: u(2.1) }}
      >
        {formats.date.format(value)}
      </p>
    </div>
  );
}