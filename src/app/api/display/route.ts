//src/app/api/display/route.ts
import { NextResponse } from "next/server";
import { getDisplayData } from "@/server/services/display.service";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

// Endpoint público: solo expone monedas activas y datos de la compañía.
export async function GET() {
  try {
    return NextResponse.json(await getDisplayData(), { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}