//src/app/api/logo/route.ts
import { settingsRepository } from "@/server/repositories";

export const dynamic = "force-dynamic";

// Público, igual que /api/display: la pantalla de TV lo consume sin sesión.
export async function GET() {
  const logo = await settingsRepository.getLogo();

  if (!logo) {
    return new Response(null, { status: 404 });
  }

  // Uint8Array.from crea un Uint8Array<ArrayBuffer> "limpio" (no un Buffer<ArrayBufferLike>),
  // que es lo que exigen los tipos de BlobPart/BodyInit en esta versión de @types/node.
  const bytes = Uint8Array.from(logo.data);
  const body = new Blob([bytes], { type: logo.mimeType });

  return new Response(body, {
    headers: {
      "Content-Type": logo.mimeType,
      // La URL incluye ?v=<versión> (ver display.service.ts), así que este
      // archivo nunca cambia de contenido bajo la misma URL: se puede cachear al máximo.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}