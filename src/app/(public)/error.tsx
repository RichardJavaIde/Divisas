//src/app/(public)/error.tsx
"use client";

import { useEffect } from "react";

// Si la carga inicial falla (por ejemplo, el servidor aún arranca tras un reinicio),
// la TV reintenta sola cada 10 segundos.
export default function DisplayError({ reset }: { reset: () => void }) {
  useEffect(() => {
    const id = setTimeout(reset, 10_000);
    return () => clearTimeout(id);
  }, [reset]);

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-brand-950 p-8 text-center text-white">
      <h1 className="text-3xl font-bold sm:text-5xl">Tasas no disponibles</h1>
      <p className="text-lg text-brand-200 sm:text-2xl">Reintentando automáticamente…</p>
    </main>
  );
}