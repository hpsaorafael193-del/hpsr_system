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
      reason: "O Portal do Paciente não permite mais escolher horários. Envie uma solicitação de consulta e aguarde o contato do médico pelo e-mail cadastrado ou pelo Discord informado.",
    },
    schedulingMode: "medical_contact",
  });
}
