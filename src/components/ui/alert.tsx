//src/components/ui/alert.tsx
import type { ReactNode } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "warning";

const styles: Record<Variant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function Alert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const Icon = variant === "success" ? CircleCheck : TriangleAlert;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        styles[variant],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}