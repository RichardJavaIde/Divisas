//src/components/ui/select.tsx
import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface pl-3 pr-10 text-base text-ink transition-colors",
          "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  );
}