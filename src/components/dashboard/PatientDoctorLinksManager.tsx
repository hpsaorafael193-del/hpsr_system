"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link2, Loader2, Pencil, Trash2, X } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";
import { isClinicalProfessional, normalizeClinicalPassport } from "@/lib/clinical-scheduling";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

type Doctor = { id: string; name: string; specialty: string };
type LinkRow = {
  patient_passport: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  has_schedule_link: boolean;
  active_plan_count: number;
  portal_access: boolean;
};

type EditingLink = { passport: string; doctorId: string; specialty: string } | null;

const field = "mt-1.5 min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-bold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
const label = "text-[11px] font-black uppercase tracking-[0.11em] text-hpsr-muted";

export function PatientDoctorLinksManager() {
  const { patients } = usePatientSelection();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditingLink>(null);
  const [form, setForm] = useState({ passport: "", doctorId: "", specialty: "Clínico Geral" });

  async function load() {
    const client = createClient();
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const [profilesResult, linksResult] = await Promise.all([
        client.from("profiles").select("id,name,role,specialty,crm").eq("access_status", "Aprovado").order("name"),
        client.rpc("list_patient_schedule_links"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (linksResult.error) throw linksResult.error;
      const availableDoctors = (profilesResult.data || [])
        .filter((row) => isClinicalProfessional(row))
        .map((row) => ({ id: String(row.id), name: String(row.name || "Médico"), specialty: String(row.specialty || "Clínico Geral") }));
      setDoctors(availableDoctors);
      setLinks((linksResult.data || []) as LinkRow[]);
      setForm((current) => ({ ...current, doctorId: current.doctorId || availableDoctors[0]?.id || "" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os vínculos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const selectedDoctor = doctors.find((doctor) => doctor.id === form.doctorId);
  const selectedDoctorSpecialties = useMemo(() => {
    const values = String(selectedDoctor?.specialty || "").split(/[,;/|]+/).map((item) => item.trim()).filter(Boolean);
    return values.length ? Array.from(new Set(values)) : specialties;
  }, [selectedDoctor?.specialty]);
  const filteredLinks = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return links;
    return links.filter((row) => [row.patient_name, row.patient_passport, row.doctor_name, row.specialty]
      .some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(term)));
  }, [links, search]);

  function resetForm() {
    setEditing(null);
    setForm((current) => ({ passport: "", doctorId: current.doctorId || doctors[0]?.id || "", specialty: "Clínico Geral" }));
  }

  function startEdit(row: LinkRow) {
    setEditing({ passport: row.patient_passport, doctorId: row.doctor_id, specialty: row.specialty });
    setForm({ passport: row.patient_passport, doctorId: row.doctor_id, specialty: row.specialty });
    setMessage("");
    setError("");
  }

  async function writeLink(enabled: boolean, values: { passport: string; doctorId: string; specialty: string }) {
    const client = createClient();
    if (!client) throw new Error("Supabase não configurado.");
    const doctor = doctors.find((item) => item.id === values.doctorId);
    if (!doctor) throw new Error("Selecione um médico válido.");
    const { error: rpcError } = await client.rpc("set_patient_schedule_link", {
      target_passport: normalizeClinicalPassport(values.passport),
      target_doctor_id: values.doctorId,
      target_doctor_name: doctor.name,
      target_specialty: values.specialty,
      target_enabled: enabled,
    });
    if (rpcError) throw rpcError;
  }

  async function save() {
    const passport = normalizeClinicalPassport(form.passport);
    if (!passport || !form.doctorId || !form.specialty) {
      setError("Selecione paciente, médico e especialidade.");
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      if (editing) {
        const changed = editing.passport !== passport || editing.doctorId !== form.doctorId || editing.specialty !== form.specialty;
        if (changed) {
          await writeLink(false, editing);
          try {
            await writeLink(true, { passport, doctorId: form.doctorId, specialty: form.specialty });
          } catch (caught) {
            await writeLink(true, editing).catch(() => undefined);
            throw caught;
          }
        }
        setMessage("Vínculo atualizado. O Portal do Paciente passará a usar esta associação explícita para mostrar os horários compatíveis.");
      } else {
        await writeLink(true, { passport, doctorId: form.doctorId, specialty: form.specialty });
        setMessage("Vínculo criado. Os horários publicados por este médico nesta especialidade já podem aparecer para o paciente.");
      }
      resetForm();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o vínculo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: LinkRow) {
    if (!row.has_schedule_link) return;
    const confirmed = await hpsrConfirm(
      row.active_plan_count > 0
        ? `Remover o vínculo de agenda entre ${row.patient_name} e ${row.doctor_name} em ${row.specialty}? Existe acompanhamento clínico formal nessa combinação; ele continuará preservado no planejamento, mas deixará de ser o vínculo administrativo explícito.`
        : `Remover o vínculo entre ${row.patient_name} e ${row.doctor_name} em ${row.specialty}?`,
      "Remover vínculo?"
    );
    if (!confirmed) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await writeLink(false, { passport: row.patient_passport, doctorId: row.doctor_id, specialty: row.specialty });
      setMessage("Vínculo de agenda removido.");
      if (editing?.passport === row.patient_passport && editing.doctorId === row.doctor_id && editing.specialty === row.specialty) resetForm();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível remover o vínculo.");
    } finally {
      setBusy(false);
    }
  }

  function prefillPlanOnly(row: LinkRow) {
    setEditing(null);
    setForm({ passport: row.patient_passport, doctorId: row.doctor_id, specialty: row.specialty });
    setMessage("Acompanhamento formal encontrado sem vínculo administrativo explícito. Confira os dados e clique em Criar vínculo.");
    setError("");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-hpsr-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Gestão interna</p>
            <h3 className="mt-1 text-lg font-black text-hpsr-text">Vínculos entre pacientes e médicos</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">Defina quem acompanha cada paciente em cada especialidade. Este vínculo controla quais agendas médicas ficam disponíveis no Portal do Paciente; o planejamento clínico continua separado para organizar os retornos.</p>
          </div>
          {editing && <button type="button" onClick={resetForm} className="inline-flex min-h-[40px] items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine"><X size={15}/>Cancelar edição</button>}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-end">
          <label className={label}>Paciente
            <StyledSelect value={form.passport} onChange={(event) => setForm({ ...form, passport: event.target.value })} className={field}>
              <option value="">Selecione...</option>
              {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
            </StyledSelect>
          </label>
          <label className={label}>Médico
            <StyledSelect value={form.doctorId} onChange={(event) => {
              const doctor = doctors.find((item) => item.id === event.target.value);
              const firstSpecialty = String(doctor?.specialty || "").split(/[,;/|]+/).map((item) => item.trim()).find(Boolean);
              setForm({ ...form, doctorId: event.target.value, specialty: firstSpecialty || form.specialty });
            }} className={field}>
              <option value="">Selecione...</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
            </StyledSelect>
          </label>
          <label className={label}>Especialidade
            <StyledSelect value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={field}>
              {!selectedDoctorSpecialties.includes(form.specialty) && <option value={form.specialty}>{form.specialty}</option>}
              {selectedDoctorSpecialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </StyledSelect>
          </label>
          <button type="button" disabled={busy || !form.passport || !form.doctorId} onClick={() => void save()} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white disabled:opacity-50">
            {busy ? <Loader2 size={17} className="animate-spin"/> : editing ? <Pencil size={17}/> : <Link2 size={17}/>}{editing ? "Salvar alteração" : "Criar vínculo"}
          </button>
        </div>
        {selectedDoctor?.specialty && <p className="mt-2 text-xs font-semibold text-hpsr-muted">Especialidades cadastradas de {selectedDoctor.name}: {selectedDoctor.specialty}</p>}
        {message && <p className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 size={16} className="mr-2 inline"/>{message}</p>}
        {error && <p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
      </section>

      <section className="rounded-[20px] border border-hpsr-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-black text-hpsr-text">Vínculos atuais</p><p className="mt-1 text-xs text-hpsr-muted">Mostra vínculos explícitos e acompanhamentos formais para facilitar a conferência.</p></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente, médico ou especialidade" className="min-h-[42px] w-full rounded-[12px] border border-hpsr-border bg-white px-3 text-sm font-semibold outline-none focus:border-hpsr-wine sm:max-w-[340px]" />
        </div>

        <div className="mt-4 space-y-2">
          {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm font-bold text-hpsr-muted"><Loader2 size={18} className="animate-spin"/>Carregando vínculos...</div> : filteredLinks.length ? filteredLinks.map((row) => (
            <article key={`${row.patient_passport}-${row.doctor_id}-${row.specialty}`} className="flex flex-col gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf6] p-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-black text-hpsr-text">{row.patient_name}</p><span className="rounded-full border border-hpsr-border bg-white px-2 py-0.5 text-[10px] font-black text-hpsr-muted">{row.patient_passport}</span></div>
                <p className="mt-1 text-sm font-bold text-hpsr-wine">{row.doctor_name} · {row.specialty}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.has_schedule_link && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">Vínculo de agenda</span>}
                  {row.active_plan_count > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Acompanhamento formal ({row.active_plan_count})</span>}
                  {!row.portal_access && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">Sem acesso ao Portal</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {row.has_schedule_link ? <>
                  <button type="button" disabled={busy} onClick={() => startEdit(row)} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine"><Pencil size={14}/>Editar</button>
                  <button type="button" disabled={busy} onClick={() => void remove(row)} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] border border-rose-200 bg-white px-3 text-xs font-black text-rose-700"><Trash2 size={14}/>Remover vínculo</button>
                </> : <button type="button" disabled={busy || !row.portal_access} onClick={() => prefillPlanOnly(row)} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine"><Link2 size={14}/>Criar vínculo de agenda</button>}
              </div>
            </article>
          )) : <div className="rounded-[15px] border border-dashed border-hpsr-border p-7 text-center text-sm font-semibold text-hpsr-muted">Nenhum vínculo encontrado.</div>}
        </div>
      </section>
    </div>
  );
}
