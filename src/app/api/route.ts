import { NextResponse } from "next/server";

// Respuesta estática: compatible con `output: export` (GitHub Pages)
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Emma Care Studio OK 🐾" });
}
