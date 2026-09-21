//src/components/admin/coming-soon.tsx
import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({ stage, description }: { stage: number; description: string }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Construction className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-medium">Sección en construcción</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        {description} Se desarrolla en la Etapa {stage}.
      </p>
    </Card>
  );
}