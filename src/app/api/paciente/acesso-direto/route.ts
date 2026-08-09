import { brazilIso } from "@/lib/brazil-datetime";
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

async function findPortalAccess(
  supabase: ReturnType<typeof getServiceClient>,
  passport: string,
) {
  const { data, error } = await supabase
    .from("patient_portal_access")
    .select("id,patient_passport,access_enabled")
    .eq("patient_passport", passport)
    .maybeSingle();

  if (error) throw error;
  return data as PortalAccessRow | null;
}

async function patientExists(
  supabase: ReturnType<typeof getServiceClient>,
  passport: string,
) {
  const { data: registryPatient, error: registryError } = await supabase
    .from("patient_registry")
    .select("passport")
    .eq("passport", passport)
    .maybeSingle();

  if (registryError) throw registryError;
  if (registryPatient) return true;

  // Compatibilidade com registros antigos sem entrada no patient_registry.
  // Cada fallback retorna no máximo uma linha, evitando varreduras e egress excessivo.
  const [recordResult, appointmentResult] = await Promise.all([
    supabase
      .from("clinical_records")
      .select("patient_passport")
      .eq("patient_passport", passport)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("passport")
      .eq("passport", passport)
      .limit(1)
      .maybeSingle(),
  ]);

  if (recordResult.error) throw recordResult.error;
  if (appointmentResult.error) throw appointmentResult.error;
  return Boolean(recordResult.data || appointmentResult.data);
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
    const sessionExpiresAt = brazilIso(new Date(Date.now() + 2 * 60 * 60 * 1000));

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
