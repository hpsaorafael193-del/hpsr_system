import { NextResponse } from "next/server";
import { readClosureStatus } from "@/lib/closure-status";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({ active: await readClosureStatus() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o estado do sistema." }, { status: 503 });
  }
}
