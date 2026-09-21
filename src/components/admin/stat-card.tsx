//src/components/admin/stat-card.tsx
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}