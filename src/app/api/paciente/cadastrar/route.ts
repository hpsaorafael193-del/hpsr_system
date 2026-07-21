import { formatPhoneNumber } from "@/lib/phone";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, normalizePassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

function clean(value: unknown, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;
  try {
    const body = await request.json();
    const name = clean(body.name, 160);
    const passport = normalizePassport(body.passport);
    const age = clean(body.age, 30);
    const requestedBloodType = clean(body.bloodType, 12);
    const bloodType = ["A+", "A-", "B+", "B-"].includes(requestedBloodType) ? requestedBloodType : "";
    const phone = formatPhoneNumber(clean(body.phone, 60));
    const requestedEmail = clean(body.email, 254).toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !passport || !requestedEmail || !password) {
      return NextResponse.json({ error: "Preencha nome, passaporte, e-mail e senha." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(requestedEmail)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    let linkedUserId: string | null = null;
    let email = requestedEmail;

    if (accessToken) {
      const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !authData.user) {
        return NextResponse.json({ error: "A sessão informada não é válida." }, { status: 401 });
      }
      linkedUserId = authData.user.id;
      email = String(authData.user.email || requestedEmail).trim().toLowerCase();
      if (email !== requestedEmail) {
        return NextResponse.json({ error: "O e-mail do cadastro deve ser o mesmo da conta autenticada." }, { status: 400 });
      }
    }

    const [{ data: accountByPassport }, { data: accountByEmail }, { data: accountByUser }] = await Promise.all([
      supabase.from("patient_accounts").select("user_id").eq("patient_passport", passport).maybeSingle(),
      supabase.from("patient_accounts").select("user_id").eq("email", email).maybeSingle(),
      linkedUserId
        ? supabase.from("patient_accounts").select("user_id").eq("user_id", linkedUserId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const existingAccount = accountByPassport || accountByEmail || accountByUser;
    if (existingAccount) {
      if (linkedUserId && existingAccount.user_id === linkedUserId) {
        return NextResponse.json({ ok: true, alreadyLinked: true, message: "Sua conta já está vinculada ao Portal do Paciente." });
      }
      return NextResponse.json({ error: "Já existe uma conta vinculada a este passaporte ou e-mail." }, { status: 409 });
    }

    const { data: existingPatient, error: patientLookupError } = await supabase
      .from("patient_registry")
      .select("passport,name,age,blood_type,city_phone,email")
      .eq("passport", passport)
      .maybeSingle();
    if (patientLookupError) throw patientLookupError;

    if (!linkedUserId) {
      const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { account_type: "patient", patient_passport: passport },
      });
      if (authError || !authResult.user) {
        const accountExists = authError?.message?.toLowerCase().includes("already");
        return NextResponse.json({
          code: accountExists ? "AUTH_ACCOUNT_EXISTS" : "AUTH_ACCOUNT_CREATE_FAILED",
          error: accountExists
            ? "Este e-mail já possui uma conta no Hospital São Rafael. Entre com a mesma senha pelo Portal para vinculá-la como paciente."
            : "Não foi possível criar a conta do paciente.",
        }, { status: accountExists ? 409 : 500 });
      }
      linkedUserId = authResult.user.id;
      createdUserId = linkedUserId;
    }

    if (existingPatient) {
      const updates: Record<string, string> = {};
      if (!clean(existingPatient.age) && age) updates.age = age;
      if (!clean(existingPatient.blood_type) && bloodType) updates.blood_type = bloodType;
      if (!clean(existingPatient.city_phone) && phone) updates.city_phone = phone;
      if (!clean(existingPatient.email)) updates.email = email;
      if (Object.keys(updates).length) {
        const { error } = await supabase.from("patient_registry").update(updates).eq("passport", passport);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase.from("patient_registry").insert({
        passport,
        name,
        age: age || null,
        blood_type: bloodType || null,
        city_phone: phone || null,
        email,
        follow_up: "Rotina",
      });
      if (error) throw error;
    }

    const { error: accountError } = await supabase.from("patient_accounts").insert({
      user_id: linkedUserId,
      patient_passport: passport,
      email,
    });
    if (accountError) throw accountError;

    const { data: portalAccess } = await supabase
      .from("patient_portal_access")
      .select("id")
      .eq("patient_passport", passport)
      .maybeSingle();
    if (portalAccess?.id) {
      await supabase.from("patient_portal_access").update({ email, access_enabled: true }).eq("id", portalAccess.id);
    } else {
      await supabase.from("patient_portal_access").insert({ patient_passport: passport, email, access_enabled: true });
    }

    return NextResponse.json({
      ok: true,
      linkedExistingAccount: !createdUserId,
      message: createdUserId
        ? "Conta criada. Entre com seu e-mail e senha."
        : "Conta vinculada ao Portal do Paciente com sucesso.",
    });
  } catch (error) {
    console.error("[patient-portal] register", error);
    if (createdUserId) {
      try { await getServiceClient().auth.admin.deleteUser(createdUserId); } catch {}
    }
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}
