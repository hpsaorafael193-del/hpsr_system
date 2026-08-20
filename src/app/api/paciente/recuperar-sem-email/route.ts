import { NextRequest, NextResponse } from "next/server";
import { brazilIso } from "@/lib/brazil-datetime";
import {
  getPatientSessionCookieName,
  getServiceClient,
  normalizePassport,
  patientSecretMatches,
  normalizeRecoveryCode,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

const INVALID = "Código de recuperação inválido ou expirado.";

type RecoveryPurpose = "self_recovery" | "assisted_recovery";

function recoveryPurpose(code: string): RecoveryPurpose | null {
  if (/^\d{6}$/.test(code)) return "assisted_recovery";
  if (/^HPSR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) return "self_recovery";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    const recoveryCode = normalizeRecoveryCode(body.recoveryCode);
    const newPassword = String(body.newPassword || "");
    const purpose = recoveryPurpose(recoveryCode);

    if (!passport || !purpose) return NextResponse.json({ error: INVALID }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });

    const supabase = getServiceClient();
    const { data: access, error: accessError } = await supabase
      .from("patient_portal_access")
      .select("id,patient_passport,access_enabled")
      .eq("patient_passport", passport)
      .maybeSingle();
    if (accessError) throw accessError;
    if (!access?.access_enabled) return NextResponse.json({ error: INVALID }, { status: 401 });

    const { data: candidate, error: candidateError } = await supabase
      .from("patient_access_codes")
      .select("id,code_hash,expires_at,attempt_count,max_attempts,used_at,invalidated_at")
      .eq("portal_access_id", access.id)
      .eq("purpose", purpose)
      .is("used_at", null)
      .is("invalidated_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (candidateError) throw candidateError;

    if (!candidate || candidate.attempt_count >= candidate.max_attempts || new Date(candidate.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    if (!patientSecretMatches(candidate.code_hash, recoveryCode)) {
      const nextAttempts = candidate.attempt_count + 1;
      await supabase.from("patient_access_codes").update({
        attempt_count: nextAttempts,
        invalidated_at: nextAttempts >= candidate.max_attempts ? brazilIso() : null,
      }).eq("id", candidate.id);
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const { data: account, error: accountError } = await supabase
      .from("patient_accounts")
      .select("user_id,email")
      .eq("patient_passport", passport)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ error: INVALID }, { status: 401 });

    const { data: professionalProfile, error: professionalError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", account.user_id)
      .eq("access_status", "Aprovado")
      .maybeSingle();
    if (professionalError) throw professionalError;
    if (professionalProfile) return NextResponse.json({ error: INVALID }, { status: 401 });

    const { error: updateError } = await supabase.auth.admin.updateUserById(account.user_id, { password: newPassword });
    if (updateError) throw updateError;

    const now = brazilIso();
    const [sessionResult, codesResult] = await Promise.all([
      supabase.from("patient_portal_sessions").update({ revoked_at: now }).eq("portal_access_id", access.id).is("revoked_at", null),
      supabase.from("patient_access_codes").update({ invalidated_at: now }).eq("portal_access_id", access.id).in("purpose", ["self_recovery", "assisted_recovery"]).is("used_at", null).is("invalidated_at", null),
    ]);
    if (sessionResult.error) throw sessionResult.error;
    if (codesResult.error) throw codesResult.error;
    await supabase.from("patient_access_codes").update({ used_at: now, invalidated_at: null }).eq("id", candidate.id);

    try {
      await supabase.from("system_activities").insert({
        module: "Portal do Paciente",
        action: "Recuperação de acesso",
        description: purpose === "assisted_recovery"
          ? "Senha redefinida com código temporário emitido pela equipe. Sessões do portal foram revogadas."
          : "Senha redefinida com código pessoal de recuperação. Sessões do portal foram revogadas.",
        actor: `Paciente ${passport}`,
        reference: passport,
      });
    } catch {}

    const response = NextResponse.json({
      ok: true,
      email: String(account.email || "").trim().toLowerCase(),
      message: "Senha redefinida com segurança. Entre novamente usando o e-mail cadastrado e a nova senha.",
    });
    response.cookies.set(getPatientSessionCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[patient-portal] recovery without email", error);
    return NextResponse.json({ error: "Não foi possível concluir a recuperação agora." }, { status: 500 });
  }
}
