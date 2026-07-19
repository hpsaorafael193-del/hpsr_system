import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  getPatientSessionCookieName,
  getServiceClient,
  hashPatientSecret,
  normalizePassport,
  requestFingerprint,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";

type PortalAccessRow = {
  id: string;
  patient_passport: string;
  access_enabled: boolean;
};

function samePassport(value: unknown, expected: string) {
  return normalizePassport(value) === expected;
}

async function findPortalAccess(
  supabase: ReturnType<typeof getServiceClient>,
  passport: string,
) {
  const { data, error } = await supabase
    .from("patient_portal_access")
    .select("id,patient_passport,access_enabled")
    .limit(5000);

  if (error) throw error;
  return ((data || []) as PortalAccessRow[]).find((row) => samePassport(row.patient_passport, passport)) || null;
}

async function patientExists(
  supabase: ReturnType<typeof getServiceClient>,
  passport: string,
) {
  const [recordsResult, appointmentsResult] = await Promise.all([
    supabase.from("clinical_records").select("patient_passport").limit(5000),
    supabase.from("appointments").select("passport").limit(5000),
  ]);

  if (recordsResult.error) throw recordsResult.error;
  if (appointmentsResult.error) throw appointmentsResult.error;

  return (
    (recordsResult.data || []).some((row) => samePassport(row.patient_passport, passport)) ||
    (appointmentsResult.data || []).some((row) => samePassport(row.passport, passport))
  );
}

async function ensurePortalAccess(
  supabase: ReturnType<typeof getServiceClient>,
  passport: string,
) {
  const existing = await findPortalAccess(supabase, passport);
  if (existing) {
    if (!existing.access_enabled) {
      const { data, error } = await supabase
        .from("patient_portal_access")
        .update({ access_enabled: true })
        .eq("id", existing.id)
        .select("id,patient_passport,access_enabled")
        .single();
      if (error) throw error;
      return data as PortalAccessRow;
    }
    return existing;
  }

  if (!(await patientExists(supabase, passport))) return null;

  const safePassport = passport.replace(/[^A-Z0-9]/g, "").slice(0, 48) || "paciente";
  const { data, error } = await supabase
    .from("patient_portal_access")
    .insert({
      patient_passport: passport,
      email: `portal-direto+${safePassport.toLowerCase()}@hpsr.local`,
      access_enabled: true,
    })
    .select("id,patient_passport,access_enabled")
    .single();

  if (!error) return data as PortalAccessRow;

  // Protege contra duas tentativas simultâneas de criar o mesmo acesso.
  if (error.code === "23505") return findPortalAccess(supabase, passport);
  throw error;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);

    if (!passport) {
      return NextResponse.json({ ok: false, error: "Informe o passaporte do paciente." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const access = await ensurePortalAccess(supabase, passport);

    if (!access) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhum paciente foi localizado com este passaporte nos prontuários ou consultas cadastradas.",
        },
        { status: 404 },
      );
    }

    const token = generateSessionToken();
    const fingerprint = requestFingerprint(request);
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("patient_portal_sessions").insert({
      portal_access_id: access.id,
      token_hash: hashPatientSecret(token),
      expires_at: sessionExpiresAt,
      request_ip_hash: fingerprint.ipHash,
      user_agent: fingerprint.userAgent,
    });
    if (sessionError) throw sessionError;

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getPatientSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[patient-portal] direct-access", error);
    const detail = error instanceof Error ? error.message : "";
    const configurationError = /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL/i.test(detail);
    return NextResponse.json(
      {
        ok: false,
        error: configurationError
          ? "O acesso direto precisa das credenciais servidoras do Supabase no arquivo .env.local."
          : "Não foi possível acessar o portal agora.",
      },
      { status: 500 },
    );
  }
}
