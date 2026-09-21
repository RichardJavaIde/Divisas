//src/components/ui/flag-icon.tsx
import { cn } from "@/lib/utils";

/**
 * Bandera de un país. El tamaño lo controla el font-size (text-2xl, text-6xl…).
 * Sin código válido muestra un recuadro gris del mismo tamaño.
 */
export function FlagIcon({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  if (!code || !/^[a-z]{2}$/.test(code)) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block h-[1em] w-[1.3333em] shrink-0 rounded-[3px] bg-slate-200",
          className,
        )}
      />
    );
  }

  return <span aria-hidden className={cn("fi shrink-0 rounded-[3px]", `fi-${code}`, className)} />;
}