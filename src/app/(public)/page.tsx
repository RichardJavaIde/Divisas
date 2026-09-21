//src/app/(public)/page.tsx
import type { Metadata } from "next";
import { DisplayScreen } from "@/components/display/display-screen";
import { getDisplayData } from "@/server/services/display.service";

export const metadata: Metadata = { title: "Tasas de cambio" };

// Las tasas cambian en cualquier momento: nunca se genera de forma estática
export const dynamic = "force-dynamic";

export default async function PublicDisplayPage() {
  const initialData = await getDisplayData();
  return <DisplayScreen initialData={initialData} />;
}