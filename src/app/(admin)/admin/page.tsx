//src/app/(admin)/admin/page.tsx
import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Panel administrativo" };

export default async function AdminDashboardPage() {
  // Los layouts no se vuelven a ejecutar en cada navegación interna,
  // por eso cada página y cada acción protegida valida la sesión por su cuenta.
  const user = await requireUser();

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Hola, {user.name}</h1>
      <p className="mt-2 text-ink-muted">Sesión activa. El dashboard se construye en la Etapa 4.</p>
    </main>
  );
}