"use client";

import { FormEvent, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Baby,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Hospital,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TimerReset,
  UsersRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

type ProcedureType =
  | "parto-normal"
  | "cesarea"
  | "parto-humanizado"
  | "fiv"
  | "procedimento-geral";

type ProcedureProfessional = {
  name: string;
  passport: string;
};

type ProcedureRequest = {
  id: string;
  passport: string;
  patient: string;
  procedure: string;
  procedureType: ProcedureType;
  responsible: string;
  team: string[];
  professionals: ProcedureProfessional[];
  room: string;
  date: string;
  start: string;
  status: string;
  observations?: string;
};

type ProcedureFormState = {
  patient: string;
  passport: string;
  procedureType: ProcedureType;
  room: string;
  date: string;
  start: string;
  observations: string;
  professionals: ProcedureProfessional[];
};

const directorRoles = ["Diretora", "Vice Diretor", "Diretor Clínico"];

const procedureDurations: Record<ProcedureType, number> = {
  "parto-normal": 4,
  cesarea: 4,
  "parto-humanizado": 4,
  fiv: 1,
  "procedimento-geral": 2,
};

const procedureOptions: Array<{ value: ProcedureType; label: string }> = [
  { value: "parto-normal", label: "Parto normal" },
  { value: "cesarea", label: "Cesárea" },
  { value: "parto-humanizado", label: "Parto humanizado" },
  { value: "fiv", label: "FIV" },
  { value: "procedimento-geral", label: "Procedimento geral" },
];

const roomOptions = [
  "Sala Cirúrgica 01",
  "Sala de Procedimentos 02",
  "Centro Obstétrico",
  "Sala de Observação",
];

const procedureTheme: Record<ProcedureType, { label: string; icon: ReactNode; accent: string; soft: string }> = {
  "parto-normal": {
    label: "Parto",
    icon: <Baby size={18} />,
    accent: "from-[#8a3b25] to-[#b9825e]",
    soft: "bg-[#fff3e8] text-[#8a3b25] border-[#efd0bc]",
  },
  cesarea: {
    label: "Cesárea",
    icon: <Hospital size={18} />,
    accent: "from-[#672614] to-[#a65f3c]",
    soft: "bg-[#f9ece4] text-hpsr-wine border-[#e7c8b7]",
  },
  "parto-humanizado": {
    label: "Humanizado",
    icon: <HeartPulse size={18} />,
    accent: "from-[#78401f] to-[#bd8b62]",
    soft: "bg-[#fff5eb] text-[#7a3b1c] border-[#ecd1b9]",
  },
  fiv: {
    label: "FIV",
    icon: <Sparkles size={18} />,
    accent: "from-[#6b4c2f] to-[#b79b75]",
    soft: "bg-[#f8f1e8] text-[#6b4c2f] border-[#e4d5c4]",
  },
  "procedimento-geral": {
    label: "Procedimento",
    icon: <Stethoscope size={18} />,
    accent: "from-[#5f2b1b] to-[#9c7256]",
    soft: "bg-[#f7efe7] text-hpsr-wine border-hpsr-border",
  },
};

const initialProcedureRequests: ProcedureRequest[] = [];

const nextAvailableSlots = [
  { date: "2026-07-22", start: "22:00", room: "Sala Cirúrgica 01", fit: "FIV ou procedimento geral" },
  { date: "2026-07-23", start: "18:00", room: "Centro Obstétrico", fit: "Partos e cesáreas" },
  { date: "2026-07-23", start: "21:00", room: "Sala de Procedimentos 02", fit: "FIV" },
  { date: "2026-07-24", start: "22:00", room: "Centro Obstétrico", fit: "FIV ou procedimento geral" },
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function getEndTime(item: ProcedureRequest) {
  return minutesToTime(timeToMinutes(item.start) + procedureDurations[item.procedureType] * 60);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function hasRoomConflict(item: ProcedureRequest, procedures: ProcedureRequest[]) {
  const itemStart = timeToMinutes(item.start);
  const itemEnd = timeToMinutes(getEndTime(item));

  return procedures.some((other) => {
    if (other.id === item.id) return false;
    if (other.date !== item.date || other.room !== item.room) return false;

    const otherStart = timeToMinutes(other.start);
    const otherEnd = timeToMinutes(getEndTime(other));

    return itemStart < otherEnd && itemEnd > otherStart;
  });
}

function getProcedureRule(type: ProcedureType) {
  if (type === "parto-normal" || type === "cesarea" || type === "parto-humanizado") return "4 horas";
  if (type === "fiv") return "1 hora";
  return "2 horas";
}

function getProcedureLabel(type: ProcedureType) {
  return procedureOptions.find((option) => option.value === type)?.label ?? "Procedimento geral";
}

function createInitialForm(): ProcedureFormState {
  return {
    patient: "",
    passport: "",
    procedureType: "procedimento-geral",
    room: "Sala Cirúrgica 01",
    date: new Date().toISOString().slice(0, 10),
    start: "18:00",
    observations: "",
    professionals: [{ name: "", passport: "" }],
  };
}

export default function ProcedureSchedulePage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [procedures, setProcedures] = useState<ProcedureRequest[]>(initialProcedureRequests);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRequest | null>(null);

  const canScheduleProcedures =
    directorRoles.includes(currentUserProfile.role) ||
    currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";


  function handleCreateProcedure(form: ProcedureFormState) {
    const professionals = form.professionals.filter((professional) =>
      professional.name.trim() && professional.passport.trim()
    );

    const procedure: ProcedureRequest = {
      id: `proc-${Date.now()}`,
      passport: form.passport.trim(),
      patient: form.patient.trim(),
      procedure: getProcedureLabel(form.procedureType),
      procedureType: form.procedureType,
      responsible: professionals[0]?.name || currentUserProfile.systemName,
      team: professionals.map((professional) => professional.name),
      professionals,
      room: form.room,
      date: form.date,
      start: form.start,
      status: "solicitado",
      observations: form.observations.trim(),
    };

    setProcedures((current) => [procedure, ...current]);
    setScheduleOpen(false);
  }

  function handleUpdateProcedure(form: ProcedureFormState) {
    if (!editingProcedure) return;
    const professionals = form.professionals.filter((professional) => professional.name.trim() && professional.passport.trim());
    setProcedures((current) => current.map((item) => item.id === editingProcedure.id ? {
      ...item,
      passport: form.passport.trim(),
      patient: form.patient.trim(),
      procedure: getProcedureLabel(form.procedureType),
      procedureType: form.procedureType,
      responsible: professionals[0]?.name || item.responsible,
      team: professionals.map((professional) => professional.name),
      professionals,
      room: form.room,
      date: form.date,
      start: form.start,
      observations: form.observations.trim(),
      status: "solicitado",
    } : item));
    setEditingProcedure(null);
  }

  async function analyzeProcedure(item: ProcedureRequest) {
    const conflict = hasRoomConflict(item, procedures);
    if (conflict) { void hpsrAlert("Não é possível confirmar enquanto houver conflito de sala.", "Conflito de agendamento"); return; }
    if (!(await hpsrConfirm(`Confirmar a análise e aprovar o procedimento de ${item.patient}?`, "Aprovar procedimento"))) return;
    setProcedures((current) => current.map((procedure) => procedure.id === item.id ? { ...procedure, status: "confirmado" } : procedure));
  }

  return (
    <div className="hpsr-page max-w-[1500px] gap-3">
      <PageHeader
        eyebrow="Agendamentos"
        title="Agenda de Procedimentos"
        description="Organização de procedimentos com bloqueio de sala, equipe e tempo conforme o procedimento."
      />

      <section className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-hpsr-text lg:px-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine">
              <ShieldAlert size={15} />
              Centro de procedimentos
            </span>
            <h2 className="mt-2 max-w-4xl text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight tracking-tight">
              Planejamento de procedimentos com tempo reservado e equipe definida
            </h2>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-hpsr-muted">
              Partos bloqueiam 4 horas, procedimentos gerais 2 horas e FIV 1 hora. Somente Diretoria pode agendar, analisar ou reagendar procedimentos.
            </p>
          </div>

          {canScheduleProcedures && (
            <div className="flex lg:justify-end">
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition"
              >
                <CalendarClock size={17} />
                Agendar procedimento
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <RuleCard icon={<Baby size={18} />} title="Partos e cesáreas" description="Normal, cesárea e humanizado bloqueiam 4h." highlight="4h" />
        <RuleCard icon={<Sparkles size={18} />} title="FIV" description="Procedimento de fertilização bloqueia 1h." highlight="1h" />
        <RuleCard icon={<Stethoscope size={18} />} title="Demais procedimentos" description="Procedimentos restantes bloqueiam 2h." highlight="2h" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
          <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#a67a5f)] text-white">
                <Hospital size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-hpsr-text">Mapa de procedimentos</h2>
                <p className="text-xs text-hpsr-muted">Cards com duração, sala, equipe, médicos participantes e permissão.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-2xl border border-hpsr-border bg-white/[0.86] px-3 py-2 text-xs font-semibold text-hpsr-wine">
                Sala + médicos + paciente
              </span>
              <span className="rounded-2xl border border-hpsr-border bg-white/[0.86] px-3 py-2 text-xs font-semibold text-hpsr-wine">
                Sem sobreposição
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-3.5">
            {procedures.map((item) => {
              const conflict = hasRoomConflict(item, procedures);
              const theme = procedureTheme[item.procedureType];

              return (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-[16px] border bg-white transition ${
                    conflict ? "border-rose-200 ring-2 ring-rose-100" : "border-hpsr-border"
                  }`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${theme.accent}`} />

                  <div className="grid gap-3 p-3.5 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-stretch">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${theme.soft}`}>
                          {theme.icon}
                          {theme.label}
                        </span>
                        <StatusBadge status={item.status} />
                        <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-[11px] font-bold text-hpsr-wine">
                          {getProcedureRule(item.procedureType)} reservadas
                        </span>
                        {conflict && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700">
                            <AlertTriangle size={12} />
                            Conflito de sala
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-hpsr-text">{item.procedure}</h3>
                      <p className="mt-1 text-sm text-hpsr-muted">
                        {item.patient} · Passaporte {item.passport} · Responsável: {item.responsible}
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoPill icon={<CalendarClock size={14} />} label="Data" value={formatDate(item.date)} />
                        <InfoPill icon={<Clock3 size={14} />} label="Horário" value={`${item.start} às ${getEndTime(item)}`} />
                        <InfoPill icon={<MapPin size={14} />} label="Sala" value={item.room} />
                        <InfoPill icon={<UsersRound size={14} />} label="Equipe" value={item.team.join(", ") || "—"} />
                      </div>

                      <div className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] px-4 py-3">
                        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                          <UsersRound size={14} />
                          Médicos participantes
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.professionals.map((professional) => (
                            <span
                              key={`${professional.name}-${professional.passport}`}
                              className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-bold text-hpsr-text"
                            >
                              {professional.name} · Passaporte {professional.passport}
                            </span>
                          ))}
                        </div>
                      </div>

                      {item.observations && (
                        <p className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-xs font-semibold text-hpsr-muted">
                          <strong className="text-hpsr-wine">Observações:</strong> {item.observations}
                        </p>
                      )}

                      {conflict && (
                        <p className="mt-3 inline-flex items-start gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                          Existe outro procedimento usando a mesma sala dentro deste intervalo. Confirmação deve ficar bloqueada até ajustar horário ou sala.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col justify-between rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">Tempo reservado</p>
                        <p className="mt-1 text-lg font-bold text-hpsr-text">
                          {procedureDurations[item.procedureType]}h
                        </p>
                        <p className="mt-1 text-xs text-hpsr-muted">Bloqueio automático no mapa de procedimentos.</p>
                      </div>

                      {canScheduleProcedures ? (
                        <div className="mt-4 grid gap-2">
                          <button
                            type="button"
                            onClick={() => analyzeProcedure(item)}
                            title="Analisar procedimento"
                            className="rounded-2xl bg-[linear-gradient(135deg,#672614,#74321e)] px-3 py-2.5 text-xs font-semibold text-white transition"
                          >
                            Analisar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProcedure(item)}
                            title="Reagendar procedimento"
                            className="rounded-2xl border border-hpsr-border bg-white px-3 py-2.5 text-xs font-semibold text-hpsr-wine transition hover:bg-[#fffaf4]"
                          >
                            Reagendar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[14px] border border-hpsr-border bg-white px-3 py-2.5 text-xs font-semibold text-hpsr-muted">
                          Visualização liberada. Agendamento e alterações são restritos à Diretoria.
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fcf6ee] text-hpsr-wine">
                <TimerReset size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Reagendamento</p>
                <h3 className="text-lg font-bold text-hpsr-text">Horários livres</h3>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-hpsr-muted">
              O sistema exibe horários compatíveis, mas apenas a Diretoria pode confirmar ou reagendar procedimentos.
            </p>

            <div className="mt-4 grid gap-3">
              {nextAvailableSlots.map((slot) => (
                <div key={`${slot.date}-${slot.start}-${slot.room}`} className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3 transition hover:bg-[#fffdf9]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-hpsr-text">{formatDate(slot.date)} · {slot.start}</p>
                      <p className="mt-0.5 text-xs text-hpsr-muted">{slot.room}</p>
                    </div>
                    <CheckCircle2 size={17} className="text-emerald-600" />
                  </div>
                  <p className="mt-2 rounded-[14px] border border-hpsr-border bg-white/78 px-3 py-2 text-xs font-semibold text-hpsr-wine">
                    {slot.fit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fcf6ee] text-hpsr-wine">
                <UsersRound size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Equipe mínima</p>
                <h3 className="text-lg font-bold text-hpsr-text">Checklist</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <ChecklistItem title="Partos e cesáreas" description="Obstetra, enfermagem, apoio neonatal quando aplicável e sala definida." />
              <ChecklistItem title="Procedimentos gerais" description="Médico responsável, apoio de enfermagem e sala disponível por 2h." />
              <ChecklistItem title="FIV" description="Especialista responsável, apoio clínico e sala por 1h." />
            </div>
          </div>
        </aside>
      </section>

      {scheduleOpen && (
        <ScheduleProcedureModal
          onClose={() => setScheduleOpen(false)}
          onSave={handleCreateProcedure}
        />
      )}
      {editingProcedure && (
        <ScheduleProcedureModal
          initialForm={{
            patient: editingProcedure.patient,
            passport: editingProcedure.passport,
            procedureType: editingProcedure.procedureType,
            room: editingProcedure.room,
            date: editingProcedure.date,
            start: editingProcedure.start,
            observations: editingProcedure.observations || "",
            professionals: editingProcedure.professionals.length ? editingProcedure.professionals : [{ name: editingProcedure.responsible, passport: "" }],
          }}
          title="Reagendar procedimento"
          onClose={() => setEditingProcedure(null)}
          onSave={handleUpdateProcedure}
        />
      )}
    </div>
  );
}

function ScheduleProcedureModal({
  onClose,
  onSave,
  initialForm,
  title = "Agendar procedimento",
}: {
  onClose: () => void;
  onSave: (form: ProcedureFormState) => void;
  initialForm?: ProcedureFormState;
  title?: string;
}) {
  const [form, setForm] = useState<ProcedureFormState>(() => initialForm || createInitialForm());

  function updateField<K extends keyof ProcedureFormState>(field: K, value: ProcedureFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateProfessional(index: number, field: keyof ProcedureProfessional, value: string) {
    setForm((current) => ({
      ...current,
      professionals: current.professionals.map((professional, currentIndex) =>
        currentIndex === index ? { ...professional, [field]: value } : professional
      ),
    }));
  }

  function addProfessional() {
    setForm((current) => ({
      ...current,
      professionals: [...current.professionals, { name: "", passport: "" }],
    }));
  }

  function removeProfessional(index: number) {
    setForm((current) => ({
      ...current,
      professionals: current.professionals.length === 1
        ? current.professionals
        : current.professionals.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar formulário"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/55"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[16px] border border-hpsr-border bg-[#fffaf4]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f7eadb_100%)] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Diretoria</p>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">
              Informe paciente, tipo, profissionais participantes e observações opcionais.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-hpsr-border bg-white p-3 text-hpsr-wine transition hover:bg-[#fff8f0]"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[74vh] overflow-y-auto p-3.5">
          <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <h3 className="text-lg font-black text-hpsr-text">Dados do procedimento</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FormInput
                label="Nome do paciente *"
                value={form.patient}
                onChange={(value) => updateField("patient", value)}
                required
              />
              <FormInput
                label="Passaporte do paciente *"
                value={form.passport}
                onChange={(value) => updateField("passport", value)}
                required
              />

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Tipo de procedimento *</span>
                <select
                  required
                  value={form.procedureType}
                  onChange={(event) => updateField("procedureType", event.target.value as ProcedureType)}
                  className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none"
                >
                  {procedureOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Sala *</span>
                <select
                  required
                  value={form.room}
                  onChange={(event) => updateField("room", event.target.value)}
                  className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none"
                >
                  {roomOptions.map((room) => (
                    <option key={room}>{room}</option>
                  ))}
                </select>
              </label>

              <FormInput
                label="Data *"
                type="date"
                value={form.date}
                onChange={(value) => updateField("date", value)}
                required
              />
              <FormInput
                label="Horário inicial *"
                type="time"
                value={form.start}
                onChange={(value) => updateField("start", value)}
                required
              />
            </div>
          </section>

          <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-hpsr-text">Profissionais participantes</h3>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Informe apenas nome e passaporte.</p>
              </div>
              <button
                type="button"
                onClick={addProfessional}
                className="inline-flex items-center gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-white"
              >
                <Plus size={15} />
                Adicionar profissional
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {form.professionals.map((professional, index) => (
                <div key={index} className="grid gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
                  <FormInput
                    label={`Nome do profissional ${index + 1} *`}
                    value={professional.name}
                    onChange={(value) => updateProfessional(index, "name", value)}
                    required
                  />
                  <FormInput
                    label="Passaporte *"
                    value={professional.passport}
                    onChange={(value) => updateProfessional(index, "passport", value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeProfessional(index)}
                    disabled={form.professionals.length === 1}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Observações opcionais</span>
              <textarea
                value={form.observations}
                onChange={(event) => updateField("observations", event.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-none rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-sm font-semibold text-hpsr-text outline-none"
                placeholder="Ex.: orientações, preparo, prioridade, observações clínicas ou logísticas."
              />
            </label>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-hpsr-border bg-[#fff8f0] px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fffaf4]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition"
          >
            <Save size={16} />
            {title === "Reagendar procedimento" ? "Salvar reagendamento" : "Salvar agendamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  description,
  highlight,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white transition hover:bg-[#fffdf9]">
      <div className="flex items-start justify-between gap-3 p-3.5">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#a67a5f)] text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-hpsr-text">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
          </div>
        </div>
        <span className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] px-3 py-2 text-lg font-bold text-hpsr-wine">
          {highlight}
        </span>
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-hpsr-text">{value}</p>
    </div>
  );
}

function ChecklistItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-hpsr-text">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none"
      />
    </label>
  );
}
