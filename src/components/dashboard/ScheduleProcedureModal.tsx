"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Save, UserPlus, X } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import {
  createInitialProcedureForm,
  procedureOptions,
  roomOptions,
  type DoctorOption,
  type ProcedureFormState,
  type ProcedureType,
} from "@/lib/procedure-schedule";

export type ScheduleProcedureModalProps = {
  onClose: () => void;
  onSave: (form: ProcedureFormState) => Promise<void> | void;
  doctors: DoctorOption[];
  doctorsLoading: boolean;
  initialForm?: ProcedureFormState;
  title?: string;
};

export function ScheduleProcedureModal({
  onClose,
  onSave,
  doctors,
  doctorsLoading,
  initialForm,
  title = "Agendar procedimento",
}: ScheduleProcedureModalProps) {
  const { patients, loading: patientsLoading, upsertPatient, selectPatient } = usePatientSelection();
  const [form, setForm] = useState<ProcedureFormState>(() => initialForm || createInitialProcedureForm());
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickPatient, setQuickPatient] = useState({ name: "", passport: "", age: "", bloodType: "" });
  const [saving, setSaving] = useState(false);

  const availableDoctors = useMemo(
    () => doctors.filter((doctor) => !form.professionals.some((professional) => professional.id === doctor.id)),
    [doctors, form.professionals],
  );

  function updateField<K extends keyof ProcedureFormState>(field: K, value: ProcedureFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectProcedurePatient(passport: string) {
    const found = patients.find((patient) => patient.passport === passport);
    setForm((current) => ({ ...current, passport, patient: found?.name || "" }));
    if (found) selectPatient(found);
  }

  function addProfessional(id: string) {
    const doctor = doctors.find((item) => item.id === id);
    if (!doctor) return;
    setForm((current) => ({
      ...current,
      professionals: current.professionals.some((professional) => professional.id === doctor.id)
        ? current.professionals
        : [...current.professionals, doctor],
    }));
  }

  function removeProfessional(id: string) {
    setForm((current) => ({
      ...current,
      professionals: current.professionals.filter((professional) => professional.id !== id),
    }));
  }

  function setResponsible(id: string) {
    setForm((current) => {
      const selected = current.professionals.find((professional) => professional.id === id);
      if (!selected) return current;
      return {
        ...current,
        professionals: [selected, ...current.professionals.filter((professional) => professional.id !== id)],
      };
    });
  }

  async function saveQuickPatient() {
    const name = quickPatient.name.trim();
    const passport = quickPatient.passport.trim().toUpperCase();
    if (!name || !passport) {
      await hpsrAlert("Informe o nome completo e o passaporte do paciente.", "Registro rápido");
      return;
    }

    const existing = patients.find((patient) => patient.passport === passport);
    if (existing) {
      selectPatient(existing);
      setForm((current) => ({ ...current, patient: existing.name, passport: existing.passport }));
      setQuickOpen(false);
      await hpsrAlert("Esse passaporte já estava cadastrado e o paciente foi selecionado.", "Paciente já cadastrado");
      return;
    }

    setQuickSaving(true);
    const patient = {
      name,
      passport,
      age: quickPatient.age.trim(),
      bloodType: quickPatient.bloodType.trim(),
    };
    const saved = await upsertPatient(patient);
    setQuickSaving(false);

    if (!saved) {
      await hpsrAlert("Não foi possível salvar o paciente no registro compartilhado do Prontuário.", "Registro rápido");
      return;
    }

    selectPatient(patient);
    setForm((current) => ({ ...current, patient: name, passport }));
    setQuickPatient({ name: "", passport: "", age: "", bloodType: "" });
    setQuickOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button type="button" aria-label="Fechar formulário" onClick={onClose} className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-[2px]" />

      <form onSubmit={(event) => void handleSubmit(event)} className="relative z-10 my-auto w-full max-w-[900px] overflow-hidden rounded-[20px] border border-hpsr-border bg-[#fffaf4] shadow-[0_30px_80px_rgba(55,19,10,0.34)]">
        <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f7eadb_100%)] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Direção</p>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">Selecione o paciente, defina o procedimento e escale os médicos participantes.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-hpsr-border bg-white p-3 text-hpsr-wine transition hover:bg-[#fff8f0]" aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-4">
          <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-hpsr-text">Paciente</h3>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Selecione um paciente já cadastrado ou use o registro rápido.</p>
              </div>
              <button type="button" onClick={() => setQuickOpen(true)} className="inline-flex items-center gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-white"><UserPlus size={15} />Registro rápido</button>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Paciente *</span>
              <StyledSelect required disabled={patientsLoading} value={form.passport} onChange={(event) => selectProcedurePatient(event.target.value)} className="mt-1.5 min-h-[42px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none">
                <option value="">{patientsLoading ? "Carregando pacientes..." : "Selecione o paciente"}</option>
                {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · Passaporte {patient.passport}</option>)}
              </StyledSelect>
            </label>
          </section>

          <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <h3 className="text-lg font-black text-hpsr-text">Dados do procedimento</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Tipo de procedimento *</span>
                <StyledSelect required value={form.procedureType} onChange={(event) => updateField("procedureType", event.target.value as ProcedureType)} className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none">
                  {procedureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </StyledSelect>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Sala *</span>
                <StyledSelect required value={form.room} onChange={(event) => updateField("room", event.target.value)} className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none">
                  {roomOptions.map((room) => <option key={room}>{room}</option>)}
                </StyledSelect>
              </label>

              <FormInput label="Data *" type="date" value={form.date} onChange={(value) => updateField("date", value)} required />
              <FormInput label="Horário inicial *" type="time" value={form.start} onChange={(value) => updateField("start", value)} required />
            </div>
          </section>

          <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div><h3 className="text-lg font-black text-hpsr-text">Médicos escalados</h3><p className="mt-1 text-sm font-semibold text-hpsr-muted">O primeiro médico da lista será exibido como responsável pelo procedimento.</p></div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Adicionar médico</span>
              <StyledSelect value="" disabled={doctorsLoading || !availableDoctors.length} onChange={(event) => addProfessional(event.target.value)} className="mt-1.5 min-h-[42px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none">
                <option value="">{doctorsLoading ? "Carregando médicos..." : availableDoctors.length ? "Selecione um médico" : "Todos os médicos disponíveis já foram adicionados"}</option>
                {availableDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.specialty || doctor.role}</option>)}
              </StyledSelect>
            </label>

            <div className="mt-4 grid gap-2">
              {form.professionals.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] px-4 py-4 text-center text-xs font-semibold text-hpsr-muted">Nenhum médico escalado ainda.</div>
              ) : form.professionals.map((professional, index) => (
                <div key={professional.id} className="flex flex-col gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-hpsr-text">{professional.name}</p>{index === 0 && <span className="rounded-full bg-hpsr-wine px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white">Responsável</span>}</div><p className="mt-1 text-xs font-semibold text-hpsr-muted">{professional.specialty || professional.role}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {index > 0 && <button type="button" onClick={() => setResponsible(professional.id)} className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-[11px] font-black text-hpsr-wine">Definir responsável</button>}
                    <button type="button" onClick={() => removeProfessional(professional.id)} className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <label className="block"><span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Resumo / observações</span><textarea value={form.observations} onChange={(event) => updateField("observations", event.target.value)} rows={4} className="mt-1.5 w-full resize-none rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-sm font-semibold text-hpsr-text outline-none" placeholder="Ex.: preparo necessário, prioridade, orientação logística ou breve resumo do procedimento." /></label>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-hpsr-border bg-[#fff8f0] px-4 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fffaf4]">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{title === "Editar procedimento" ? "Salvar alterações" : "Salvar agendamento"}</button>
        </div>
      </form>

      {quickOpen && (
        <div className="fixed inset-0 z-[100001] grid place-items-center bg-[#1f0805]/60 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-2xl">
            <div className="flex items-start justify-between border-b border-hpsr-border bg-white px-5 py-4">
              <div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-hpsr-border text-hpsr-wine"><UserPlus size={19} /></div><div><h3 className="font-black text-hpsr-text">Registro rápido de paciente</h3><p className="text-xs font-semibold text-hpsr-muted">O paciente será salvo no registro compartilhado e selecionado automaticamente.</p></div></div>
              <button type="button" onClick={() => setQuickOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><X size={18} /></button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Nome completo<input className={quickInputClass} value={quickPatient.name} onChange={(event) => setQuickPatient((current) => ({ ...current, name: event.target.value }))} /></label>
              <label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Documento / Passaporte<input className={quickInputClass} value={quickPatient.passport} onChange={(event) => setQuickPatient((current) => ({ ...current, passport: event.target.value }))} /></label>
              <label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Idade<input className={quickInputClass} value={quickPatient.age} onChange={(event) => setQuickPatient((current) => ({ ...current, age: event.target.value }))} /></label>
              <label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Tipo sanguíneo<StyledSelect className={quickInputClass} value={quickPatient.bloodType} onChange={(event) => setQuickPatient((current) => ({ ...current, bloodType: event.target.value }))}><option value="">Selecione</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bloodType) => <option key={bloodType}>{bloodType}</option>)}</StyledSelect></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-hpsr-border bg-white px-5 py-4"><button type="button" onClick={() => setQuickOpen(false)} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text">Cancelar</button><button type="button" disabled={quickSaving} onClick={() => void saveQuickPatient()} className="inline-flex items-center gap-2 rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white disabled:opacity-60">{quickSaving && <Loader2 size={14} className="animate-spin" />}Salvar paciente</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const quickInputClass = "mt-1.5 min-h-[42px] w-full rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none";

function FormInput({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none" />
    </label>
  );
}
