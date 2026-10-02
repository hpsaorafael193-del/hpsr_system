import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Notice = { id: string; passport: string; kind: "exam" | "document" | "appointment" | "reschedule" | "guardian"; title: string; description: string; at: string; section: "records" | "appointments" | "pending" | "exam-request" | "vaccination" | "home" };

// Retorna somente avisos de prontuários ligados à sessão verificada no servidor.
// A leitura clínica continua condicionada às rotas de cada prontuário.
export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const own = normalizePassport(valid.access.patient_passport);
    const [legacy, direct] = await Promise.all([
      own ? valid.supabase.rpc("patient_portal_accessible_patients", { target_passport: own }) : Promise.resolve({ data: [], error: null }),
      valid.access.user_id ? valid.supabase.from("patient_guardian_links")
        .select("child_passport,access_status,portal_access,updated_at")
        .eq("guardian_user_id", valid.access.user_id) : Promise.resolve({ data: [], error: null }),
    ]);
    if (legacy.error || direct.error) throw legacy.error || direct.error;
    const allowed = new Set<string>();
    if (own) allowed.add(own);
    for (const row of legacy.data || []) if (row.passport) allowed.add(normalizePassport(row.passport));
    const guardianNotices: Notice[] = [];
    const childPassports = new Set<string>();
    for (const row of legacy.data || []) if (row.passport && normalizePassport(row.passport) !== own) childPassports.add(normalizePassport(row.passport));
    for (const link of direct.data || []) {
      const child = normalizePassport(link.child_passport);
      if (link.access_status === "authorized" && link.portal_access) {
        allowed.add(child);
        childPassports.add(child);
        if (link.updated_at && Date.now() - new Date(link.updated_at).getTime() < 45 * 86400000)
          guardianNotices.push({ id: `guardian:${child}:approved:${link.updated_at}`, passport: child,
            kind: "guardian", title: "Vínculo infantil autorizado", description: "O prontuário da criança já pode ser acessado pelo menu Perfil.",
            at: link.updated_at, section: "home" });
      }
      if (link.access_status === "pending") guardianNotices.push({
        id: `guardian:${child}:pending`, passport: child, kind: "guardian", title: "Vínculo aguardando aprovação",
        description: "A Direção ainda está verificando o cadastro infantil.", at: link.updated_at || "", section: "home",
      });
    }
    const passports = [...allowed].filter(Boolean).slice(0, 30);
    if (!passports.length) return NextResponse.json({ ok: true, notices: guardianNotices });
    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const [appointments, records] = await Promise.all([
      valid.supabase.from("appointments").select("id,passport,status,updated_at,created_at,flow_type:payload->>flowType")
        .in("passport", passports).gte("updated_at", since).order("updated_at", { ascending: false }).limit(120),
      valid.supabase.from("clinical_records").select("id,patient_passport,record_type,released_at")
        .in("patient_passport", passports).eq("is_confidential", false).not("released_at", "is", null)
        .gte("released_at", since).order("released_at", { ascending: false }).limit(120),
    ]);
    if (appointments.error || records.error) throw appointments.error || records.error;
    const notices: Notice[] = [...guardianNotices];
    for (const a of appointments.data || []) {
      const status = String(a.status || "").toLocaleLowerCase("pt-BR");
      const at = a.updated_at || a.created_at || "";
      const isExamRequest = String(a.flow_type || "").toLocaleLowerCase("pt-BR").includes("exame");
      if (status.includes("reagendamento solicitado") || status === "adiada") notices.push({
        id: `appointment:${a.id}:${at}`, passport: a.passport, kind: "reschedule",
        title: "Atualização de agendamento", description: "Confira o reagendamento solicitado pelo médico.", at, section: "pending",
      });
      else if (status.includes("aceit") || ["confirmada", "agendada", "recusada", "rejeitada", "cancelada"].includes(status)) notices.push({
        id: `appointment:${a.id}:${at}`, passport: a.passport, kind: "appointment",
        title: status.includes("recus") || status.includes("rejeit") || status === "cancelada"
          ? (isExamRequest ? "Solicitação de exame recusada" : "Solicitação recusada ou cancelada")
          : (isExamRequest ? "Solicitação de exame aceita" : "Consulta confirmada"),
        description: "Confira a atualização da equipe médica.", at, section: isExamRequest ? "exam-request" : "appointments",
      });
    }
    for (const r of records.data || []) {
      const type = String(r.record_type || "");
      if (!["Exame", "Documento", "Vacina", "CadernetaVacinal"].includes(type)) continue;
      notices.push({ id: `record:${r.id}:${r.released_at}`, passport: r.patient_passport,
        kind: type === "Exame" ? "exam" : "document",
        title: type === "Exame" ? "Exame liberado" : type.includes("Vacina") ? "Vacinação atualizada" : "Documento liberado",
        description: "Um novo registro foi disponibilizado pelo hospital.", at: r.released_at || "",
        section: type.includes("Vacina") && childPassports.has(normalizePassport(r.patient_passport)) ? "vaccination" : "records" });
    }
    notices.sort((a,b) => (b.at || "").localeCompare(a.at || ""));
    return NextResponse.json({ ok: true, notices: notices.slice(0, 120) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[patient-portal] notifications", error);
    return NextResponse.json({ error: "Não foi possível consultar as notificações." }, { status: 500 });
  }
}
