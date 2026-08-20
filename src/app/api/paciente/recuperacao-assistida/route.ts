import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brazilIso } from "@/lib/brazil-datetime";
import {
  generateAccessCode,
  getServiceClient,
  hashPatientSecret,
  normalizePassport,
  requestFingerprint,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

const PURPOSE = "assisted_recovery";

async function authorizeInternalManager(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase public credentials are not configured.");

  const service = getServiceClient();
  const { data: authData, error: authError } = await service.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: allowed, error: permissionError } = await caller.rpc("is_hpsr_internal_link_manager");
  if (permissionError || allowed !== true) return null;
  return authData.user;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "Autenticação interna necessária." }, { status: 401 });

    const manager = await authorizeInternalManager(accessToken);
    if (!manager) return NextResponse.json({ error: "Somente Diretor Técnico / Dev pode emitir recuperação assistida." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    if (!passport) return NextResponse.json({ error: "Informe o passaporte do paciente." }, { status: 400 });

    const supabase = getServiceClient();
    const [{ data: account, error: accountError }, { data: access, error: accessError }, { data: patient, error: patientError }] = await Promise.all([
      supabase.from("patient_accounts").select("user_id,email").eq("patient_passport", passport).maybeSingle(),
      supabase.from("patient_portal_access").select("id,access_enabled").eq("patient_passport", passport).maybeSingle(),
      supabase.from("patient_registry").select("name").eq("passport", passport).maybeSingle(),
    ]);
    if (accountError) throw accountError;
    if (accessError) throw accessError;
    if (patientError) throw patientError;
    if (!account || !access) return NextResponse.json({ error: "Este paciente ainda não possui uma conta do Portal." }, { status: 404 });
    if (!access.access_enabled) return NextResponse.json({ error: "O acesso deste paciente ao Portal está desativado." }, { status: 403 });

    const { data: professionalProfile, error: professionalError } = await supabase
      .from("profiles")
      .select("id,access_status")
      .eq("id", account.user_id)
      .eq("access_status", "Aprovado")
      .maybeSingle();
    if (professionalError) throw professionalError;
    if (professionalProfile) {
      return NextResponse.json({ error: "Esta conta também pertence à equipe. Use a recuperação institucional da conta profissional." }, { status: 409 });
    }

    const { data: lastCode, error: lastError } = await supabase
      .from("patient_access_codes")
      .select("sent_at")
      .eq("portal_access_id", access.id)
      .eq("purpose", PURPOSE)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;
    if (lastCode?.sent_at && Date.now() - new Date(lastCode.sent_at).getTime() < 60_000) {
      return NextResponse.json({ error: "Aguarde um minuto antes de gerar outro código para este paciente." }, { status: 429 });
    }

    const now = brazilIso();
    const { error: invalidateError } = await supabase
      .from("patient_access_codes")
      .update({ invalidated_at: now })
      .eq("portal_access_id", access.id)
      .eq("purpose", PURPOSE)
      .is("used_at", null)
      .is("invalidated_at", null);
    if (invalidateError) throw invalidateError;

    const code = generateAccessCode();
    const expiresAt = brazilIso(new Date(Date.now() + 15 * 60 * 1000));
    const fingerprint = requestFingerprint(request);
    const { error: insertError } = await supabase.from("patient_access_codes").insert({
      portal_access_id: access.id,
      code_hash: hashPatientSecret(code),
      purpose: PURPOSE,
      expires_at: expiresAt,
      resend_available_at: brazilIso(new Date(Date.now() + 60 * 1000)),
      max_attempts: 5,
      request_ip_hash: fingerprint.ipHash,
      user_agent: `${fingerprint.userAgent} [ASSISTED RECOVERY]`.slice(0, 500),
      created_by: manager.id,
    });
    if (insertError) throw insertError;

    try {
      await supabase.from("system_activities").insert({
        module: "Portal do Paciente",
        action: "Código de recuperação assistida emitido",
        description: "Código temporário de uso único emitido após validação interna de identidade. Nenhum e-mail foi alterado.",
        actor: manager.email || manager.id,
        reference: passport,
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      code,
      expiresAt,
      patientName: String(patient?.name || `Paciente ${passport}`),
      message: "Código temporário gerado. Entregue somente após confirmar a identidade do paciente.",
    });
  } catch (error) {
    console.error("[patient-portal] assisted recovery", error);
    return NextResponse.json({ error: "Não foi possível emitir a recuperação assistida." }, { status: 500 });
  }
}
