import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brazilIso } from "@/lib/brazil-datetime";
import {
  generateRecoveryCode,
  getServiceClient,
  getValidPatientSession,
  hashPatientSecret,
  requestFingerprint,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

const PURPOSE = "self_recovery";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });

    const { data: code, error } = await valid.supabase
      .from("patient_access_codes")
      .select("id,expires_at,used_at,invalidated_at,attempt_count,max_attempts")
      .eq("portal_access_id", valid.access.id)
      .eq("purpose", PURPOSE)
      .is("used_at", null)
      .is("invalidated_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    const active = Boolean(
      code &&
      code.attempt_count < code.max_attempts &&
      new Date(code.expires_at).getTime() > Date.now(),
    );
    return NextResponse.json({ ok: true, configured: active, expiresAt: active ? code?.expires_at : null });
  } catch (error) {
    console.error("[patient-portal] recovery-code status", error);
    return NextResponse.json({ error: "Não foi possível consultar a proteção de recuperação." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || "");
    if (!currentPassword) return NextResponse.json({ error: "Informe sua senha atual." }, { status: 400 });

    const { data: account, error: accountError } = await valid.supabase
      .from("patient_accounts")
      .select("user_id,email")
      .eq("patient_passport", valid.access.patient_passport)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ error: "Conta do paciente não encontrada." }, { status: 404 });

    const { data: professionalProfile, error: professionalError } = await valid.supabase
      .from("profiles")
      .select("id,access_status")
      .eq("id", account.user_id)
      .eq("access_status", "Aprovado")
      .maybeSingle();
    if (professionalError) throw professionalError;
    if (professionalProfile) {
      return NextResponse.json({ error: "Esta conta também possui acesso profissional. Use a recuperação institucional da conta da equipe." }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("Supabase public credentials are not configured.");
    const verifier = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
      email: account.email,
      password: currentPassword,
    });
    if (verifyError || !verified.user || verified.user.id !== account.user_id) {
      return NextResponse.json({ error: "A senha atual não está correta." }, { status: 400 });
    }
    // A verificação cria uma sessão Auth temporária. Ela não deve permanecer ativa.
    if (verified.session?.access_token) {
      await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);
    }

    const supabase = getServiceClient();
    const now = brazilIso();
    const { error: invalidateError } = await supabase
      .from("patient_access_codes")
      .update({ invalidated_at: now })
      .eq("portal_access_id", valid.access.id)
      .eq("purpose", PURPOSE)
      .is("used_at", null)
      .is("invalidated_at", null);
    if (invalidateError) throw invalidateError;

    const recoveryCode = generateRecoveryCode();
    const expiresAt = brazilIso(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    const fingerprint = requestFingerprint(request);
    const { error: insertError } = await supabase.from("patient_access_codes").insert({
      portal_access_id: valid.access.id,
      code_hash: hashPatientSecret(recoveryCode),
      purpose: PURPOSE,
      expires_at: expiresAt,
      resend_available_at: now,
      max_attempts: 5,
      request_ip_hash: fingerprint.ipHash,
      user_agent: `${fingerprint.userAgent} [SELF RECOVERY KEY]`.slice(0, 500),
    });
    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      recoveryCode,
      expiresAt,
      message: "Código de recuperação gerado. Guarde-o em um local seguro; ele será exibido somente agora.",
    });
  } catch (error) {
    console.error("[patient-portal] recovery-code generate", error);
    return NextResponse.json({ error: "Não foi possível gerar o código de recuperação." }, { status: 500 });
  }
}
