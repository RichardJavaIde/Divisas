//src/components/admin/pagination.tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const disabledClasses = "pointer-events-none cursor-not-allowed opacity-40";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  buildHref,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  buildHref: (page: number) => string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 sm:px-5"
    >
      <p className="tabular text-sm text-ink-muted">
        {from}–{to} de {total}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-disabled={!hasPrevious}
          tabIndex={hasPrevious ? undefined : -1}
          className={cn(
            buttonClasses({ variant: "secondary", size: "sm" }),
            !hasPrevious && disabledClasses,
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Link>
        <span className="tabular hidden px-1 text-sm text-ink-muted sm:inline">
          {page} / {totalPages}
        </span>
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={cn(
            buttonClasses({ variant: "secondary", size: "sm" }),
            !hasNext && disabledClasses,
          )}
        >
          Siguiente
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}