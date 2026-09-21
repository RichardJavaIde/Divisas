//src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { settingsRepository } from "@/server/repositories";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const [user, settings, params] = await Promise.all([
    getCurrentUser(),
    settingsRepository.get(),
    searchParams,
  ]);

  // Si ya hay una sesión válida no tiene sentido mostrar el login
  if (user) redirect("/admin");

  const next = typeof params.next === "string" ? params.next : "";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-linear-to-br from-brand-950 via-brand-900 to-brand-800 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-900 text-white">
            <Landmark className="size-6" aria-hidden />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            {settings.companyName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Acceso al panel administrativo</p>
        </div>

        <LoginForm next={next} />
      </div>
    </main>
  );
}