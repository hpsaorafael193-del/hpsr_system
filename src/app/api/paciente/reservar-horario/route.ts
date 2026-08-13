import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const valid = await getValidPatientSession(request);
  if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

  return NextResponse.json(
    {
      ok: false,
      code: "PATIENT_SLOT_BOOKING_DISABLED",
      error: "O paciente não escolhe dia ou horário pelo Portal. Envie uma solicitação e aguarde o contato do médico para combinar o agendamento.",
    },
    { status: 410 },
  );
}
