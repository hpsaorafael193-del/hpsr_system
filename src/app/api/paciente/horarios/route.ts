import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const valid = await getValidPatientSession(request);
  if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

  return NextResponse.json({
    ok: true,
    slots: [],
    allowedSpecialties: [],
    diagnostics: {
      reason: "Horários de acompanhamento são mostrados diretamente em Meus acompanhamentos. Para uma nova consulta, envie apenas o pedido e combine o horário com o médico.",
    },
    schedulingMode: "contextual",
  });
}
