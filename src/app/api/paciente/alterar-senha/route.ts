import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });
    const body = await request.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    if (!currentPassword) return NextResponse.json({ error: "Informe sua senha atual." }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    if (currentPassword === newPassword) return NextResponse.json({ error: "Escolha uma senha diferente da atual." }, { status: 400 });

    const { data: account, error: accountError } = await valid.supabase
      .from("patient_accounts").select("user_id,email").eq("patient_passport", valid.access.patient_passport).maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ error: "Conta do paciente não encontrada." }, { status: 404 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("Supabase public credentials are not configured.");
    const verifier = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({ email: account.email, password: currentPassword });
    if (verifyError || !verified.user || verified.user.id !== account.user_id) {
      return NextResponse.json({ error: "A senha atual não está correta." }, { status: 400 });
    }
    if (verified.session?.access_token) {
      await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
    const { error: updateError } = await valid.supabase.auth.admin.updateUserById(account.user_id, { password: newPassword });
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, message: "Senha alterada com sucesso." });
  } catch (error) {
    console.error("[patient-portal] password change", error);
    return NextResponse.json({ error: "Não foi possível alterar sua senha." }, { status: 500 });
  }
}
