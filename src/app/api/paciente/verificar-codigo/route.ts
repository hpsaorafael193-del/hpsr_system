import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Mantido apenas como resposta compatível para clientes antigos. Não cria mais sessão.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Este fluxo de acesso foi descontinuado por segurança." },
    { status: 404 },
  );
}
