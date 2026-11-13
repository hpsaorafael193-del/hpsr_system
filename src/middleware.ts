import { NextRequest, NextResponse } from "next/server";
import { readClosureStatus } from "@/lib/closure-status";
import { CLOSURE_MESSAGE } from "@/lib/hospital-closure";

// Only account access and session management remain writable over the portal API.
const accessRoutes = new Set([
  "/api/paciente/alterar-senha", "/api/paciente/codigo-recuperacao",
  "/api/paciente/recuperar-sem-email", "/api/paciente/estabelecer-sessao",
  "/api/paciente/sair", "/api/paciente/solicitar-codigo", "/api/paciente/verificar-codigo",
]);

export async function middleware(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method) || accessRoutes.has(request.nextUrl.pathname)) return NextResponse.next();
  try {
    if (!(await readClosureStatus())) return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Não foi possível verificar se o sistema aceita novos registros." }, { status: 503 });
  }
  return NextResponse.json({ error: CLOSURE_MESSAGE }, { status: 403 });
}

export const config = { matcher: "/api/:path*" };
