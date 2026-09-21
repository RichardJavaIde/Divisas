//src/components/ui/input.tsx
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("block text-sm font-medium text-ink", className)} {...props} />
  );
}

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        // text-base (16px) evita el zoom automático en iPhone
        "h-11 w-full rounded-lg border bg-surface px-3 text-base text-ink transition-colors",
        "placeholder:text-slate-400 focus:outline-none focus:ring-4",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid
          ? "border-sell focus:border-sell focus:ring-sell/15"
          : "border-border-subtle focus:border-brand-500 focus:ring-brand-500/15",
        className,
      )}
      {...props}
    />
  );
}