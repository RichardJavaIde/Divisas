//src/components/display/logo.tsx
"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { u } from "./layout";

/** Logo de la compañía. Si no hay logo o falla la carga, muestra un ícono. */
export function Logo({ url, name }: { url: string | null; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const box = { width: u(9), height: u(9) };

  if (!url || failedUrl === url) {
    return (
      <span
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-[22%] bg-white/10"
        style={box}
      >
        <Landmark style={{ width: u(5), height: u(5) }} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      onError={() => setFailedUrl(url)}
      className="shrink-0 object-contain"
      style={box}
    />
  );
}