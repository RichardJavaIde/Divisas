//src/app/(admin)/admin/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel administrativo" };

export default function AdminDashboardPage() {
  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Panel administrativo</h1>
      <p className="mt-2 text-ink-muted">
        Layout y navegación se construyen en la Etapa 4.
      </p>
    </main>
  );
}