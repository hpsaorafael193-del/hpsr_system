import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Fluxo legado de código por passaporte/e-mail. A autenticação atual usa Supabase Auth
// e a recuperação alternativa possui rotas próprias com finalidade explícita.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Este fluxo de acesso foi descontinuado por segurança." },
    { status: 404 },
  );
}
