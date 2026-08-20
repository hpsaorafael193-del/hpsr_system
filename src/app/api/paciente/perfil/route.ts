import { NextRequest, NextResponse } from "next/server";
import { brazilDate } from "@/lib/brazil-datetime";
import { formatPhoneNumber, phoneDigits } from "@/lib/phone";
import { getValidPatientSession, normalizePassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function ageFromBirthDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const today = brazilDate().split("-").map(Number);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let age = today[0] - year;
  if (today[1] < month || (today[1] === month && today[2] < day)) age -= 1;
  return age >= 0 && age <= 130 ? String(age) : "";
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });
    const passport = normalizePassport(valid.access.patient_passport);
    const [{ data: patient, error: patientError }, { data: account, error: accountError }] = await Promise.all([
      valid.supabase.from("patient_registry").select("passport,name,birth_date,sex,city_phone,email").eq("passport", passport).maybeSingle(),
      valid.supabase.from("patient_accounts").select("user_id,email").eq("patient_passport", passport).maybeSingle(),
    ]);
    if (patientError) throw patientError;
    if (accountError) throw accountError;
    if (!patient || !account) return NextResponse.json({ error: "Não foi possível localizar seus dados." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      profile: {
        passport,
        name: clean(patient.name),
        birthDate: clean(patient.birth_date),
        sex: clean(patient.sex),
        phone: formatPhoneNumber(patient.city_phone),
        email: clean(account.email || valid.access.email || patient.email).toLowerCase(),
      },
    });
  } catch (error) {
    console.error("[patient-portal] profile get", error);
    return NextResponse.json({ error: "Não foi possível carregar seus dados." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sua sessão expirou." }, { status: 401 });
    const passport = normalizePassport(valid.access.patient_passport);
    const body = await request.json();
    const name = clean(body.name);
    const phone = formatPhoneNumber(body.phone);
    const birthDate = clean(body.birthDate);
    const sex = clean(body.sex);

    if (name.length < 2) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    if (phone && phoneDigits(phone).length < 6) return NextResponse.json({ error: "Confira o telefone informado." }, { status: 400 });
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return NextResponse.json({ error: "Confira a data de nascimento." }, { status: 400 });
    if (sex && !["Masculino", "Feminino"].includes(sex)) return NextResponse.json({ error: "Confira o sexo cadastrado." }, { status: 400 });

    const { data: account, error: accountError } = await valid.supabase
      .from("patient_accounts").select("user_id,email").eq("patient_passport", passport).maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ error: "Conta do paciente não encontrada." }, { status: 404 });

    const email = clean(account.email).toLowerCase();
    if (!email) return NextResponse.json({ error: "A conta não possui um e-mail de acesso válido." }, { status: 409 });

    // O e-mail é uma credencial protegida do Portal e não pode ser alterado pelo paciente.
    // O valor persistido em Auth/patient_accounts permanece como fonte de verdade.
    const registryUpdate: Record<string, string | null> = {
      name,
      city_phone: phone || null,
      email,
      birth_date: birthDate || null,
      sex: sex || null,
    };
    if (birthDate) registryUpdate.age = ageFromBirthDate(birthDate) || null;

    const [{ error: registryError }, { error: portalError }] = await Promise.all([
      valid.supabase.from("patient_registry").update(registryUpdate).eq("passport", passport),
      valid.supabase.from("patient_portal_access").update({ email }).eq("patient_passport", passport),
    ]);
    if (registryError) throw registryError;
    if (portalError) throw portalError;

    return NextResponse.json({ ok: true, message: "Seus dados foram atualizados.", email });
  } catch (error) {
    console.error("[patient-portal] profile patch", error);
    return NextResponse.json({ error: "Não foi possível salvar seus dados." }, { status: 500 });
  }
}
