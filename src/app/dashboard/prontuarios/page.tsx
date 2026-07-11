"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  ClipboardPlus,
  FileClock,
  FileText,
  HeartPulse,
  IdCard,
  NotebookPen,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Syringe,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { currentUserProfile } from "@/data/current-user-profile";

type RecordTab = "geral" | "timeline" | "consultas" | "exames" | "prescricoes" | "procedimentos" | "observacoes";

type PatientRecord = {
  id: string;
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  cityPhone: string;
  status: "Ativo" | "Em acompanhamento" | "Arquivado";
  followUp: string;
  lastVisit: string;
  alerts: string[];
};

type TimelineEvent = {
  id: string;
  patientPassport: string;
  type: "Consulta" | "Exame" | "Prescrição" | "Procedimento" | "Observação";
  title: string;
  date: string;
  doctor: string;
  status: string;
  summary: string;
};

const tabs: Array<{ id: RecordTab; label: string; icon: ReactNode }> = [
  { id: "geral", label: "Visão Geral", icon: <IdCard size={15} /> },
  { id: "timeline", label: "Linha do Tempo", icon: <FileClock size={15} /> },
  { id: "consultas", label: "Consultas", icon: <Stethoscope size={15} /> },
  { id: "exames", label: "Exames", icon: <FileText size={15} /> },
  { id: "prescricoes", label: "Prescrições", icon: <Pill size={15} /> },
  { id: "procedimentos", label: "Procedimentos", icon: <Syringe size={15} /> },
  { id: "observacoes", label: "Observações", icon: <NotebookPen size={15} /> },
];

const initialPatients: PatientRecord[] = [];

const initialTimelineEvents: TimelineEvent[] = [];

function formatDate(value: string) {
  if (!value.includes("-")) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusClasses(status: PatientRecord["status"]) {
  switch (status) {
    case "Em acompanhamento":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Arquivado":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function eventIcon(type: TimelineEvent["type"]) {
  const classes = "text-hpsr-wine";
  switch (type) {
    case "Consulta":
      return <Stethoscope size={17} className={classes} />;
    case "Exame":
      return <FileText size={17} className={classes} />;
    case "Prescrição":
      return <Pill size={17} className={classes} />;
    case "Procedimento":
      return <Syringe size={17} className={classes} />;
    default:
      return <NotebookPen size={17} className={classes} />;
  }
}

export default function RecordsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>(initialPatients);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassport, setSelectedPassport] = useState("");
  const [activeTab, setActiveTab] = useState<RecordTab>("geral");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const visiblePatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return patients;

    return patients.filter(
      (patient) =>
        patient.passport.includes(normalized) ||
        patient.name.toLowerCase().includes(normalized)
    );
  }, [searchTerm]);

  const searchedPatient =
    searchTerm.trim() && visiblePatients.length === 1 ? visiblePatients[0] : null;

  const selectedPatient =
    patients.find((patient) => patient.passport === selectedPassport) ?? searchedPatient;

  const patientEvents = selectedPatient
    ? timelineEvents
        .filter((event) => event.patientPassport === selectedPatient.passport)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const consultationCount = patientEvents.filter((event) => event.type === "Consulta").length;
  const examCount = patientEvents.filter((event) => event.type === "Exame").length;
  const prescriptionCount = patientEvents.filter((event) => event.type === "Prescrição").length;
  const procedureCount = patientEvents.filter((event) => event.type === "Procedimento").length;

  function handleCreateRecord(data: {
    name: string;
    passport: string;
    age: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
    recordType: TimelineEvent["type"];
    recordTitle: string;
    recordSummary: string;
  }) {
    const trimmedPassport = data.passport.trim();
    const existingPatient = patients.find((patient) => patient.passport === trimmedPassport);
    const recordDate = todayIso();

    const nextPatient: PatientRecord = existingPatient
      ? {
          ...existingPatient,
          name: data.name.trim() || existingPatient.name,
          age: data.age.trim() || existingPatient.age,
          bloodType: data.bloodType || existingPatient.bloodType,
          cityPhone: data.cityPhone.trim() || existingPatient.cityPhone,
          followUp: data.followUp.trim() || existingPatient.followUp,
          status: "Em acompanhamento",
          lastVisit: recordDate,
        }
      : {
          id: `pac-${trimmedPassport || Date.now()}`,
          name: data.name.trim(),
          passport: trimmedPassport,
          age: data.age.trim(),
          bloodType: data.bloodType,
          cityPhone: data.cityPhone.trim() || "Não informado",
          status: "Em acompanhamento",
          followUp: data.followUp.trim() || "Acompanhamento clínico",
          lastVisit: recordDate,
          alerts: ["Registro novo"],
        };

    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      patientPassport: nextPatient.passport,
      type: data.recordType,
      title: data.recordTitle.trim() || "Registro de prontuário",
      date: recordDate,
      doctor: currentUserProfile.systemName,
      status: "Concluído",
      summary: data.recordSummary.trim() || "Registro médico criado no prontuário.",
    };

    setPatients((currentPatients) => {
      if (existingPatient) {
        return currentPatients.map((patient) => (patient.passport === nextPatient.passport ? nextPatient : patient));
      }

      return [nextPatient, ...currentPatients];
    });

    setTimelineEvents((currentEvents) => [newEvent, ...currentEvents]);
    setSelectedPassport(nextPatient.passport);
    setSearchTerm("");
    setActiveTab("timeline");
    setIsRegisterOpen(false);
  }

  return (
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Prontuários"
        title="Prontuários"
        description="Histórico clínico por paciente."
      />

      <section className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.68fr)] xl:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine">
                <UsersRound size={14} />
                Painel geral dos pacientes
              </span>
              <h2 className="mt-3 text-[clamp(1.35rem,2vw,1.8rem)] font-black text-hpsr-text">
                Lista de pacientes e resumo do prontuário
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">
                Cada paciente aparece como um resumo. Ao selecionar, o painel do prontuário é expandido logo abaixo da lista.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex min-h-[52px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-white px-4 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
                <Search size={18} className="text-hpsr-muted" />
                <input
                  className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedPassport("");
                    setActiveTab("geral");
                  }}
                  placeholder="Buscar por passaporte ou nome"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 text-sm font-black text-white transition"
              >
                <Plus size={16} />
                Novo registro
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <GeneralMetric label="Pacientes" value={String(patients.length)} icon={<UserRound size={17} />} />
            <GeneralMetric label="Em acompanhamento" value={String(patients.filter((patient) => patient.status === "Em acompanhamento").length)} icon={<HeartPulse size={17} />} />
            <GeneralMetric label="Eventos clínicos" value={String(timelineEvents.length)} icon={<FileClock size={17} />} />
            <GeneralMetric label="Alertas ativos" value={String(patients.reduce((total, patient) => total + patient.alerts.length, 0))} icon={<AlertTriangle size={17} />} />
          </div>
        </div>

        <div className="grid gap-3 p-3.5 xl:grid-cols-[minmax(360px,0.45fr)_minmax(0,1fr)]">
          <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Pacientes</p>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{visiblePatients.length} resultado{visiblePatients.length === 1 ? "" : "s"}</p>
              </div>
              <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-wine">
                Lista
              </span>
            </div>

            <div className="grid max-h-[560px] gap-2 overflow-y-auto pr-1">
              {visiblePatients.map((patient) => {
                const selected = selectedPatient?.passport === patient.passport;
                const events = timelineEvents.filter((event) => event.patientPassport === patient.passport);

                return (
                  <button
                    key={patient.passport}
                    type="button"
                    onClick={() => {
                      setSelectedPassport(patient.passport);
                      setActiveTab("geral");
                    }}
                    className={`rounded-[16px] border p-3 text-left transition ${
                      selected
                        ? "border-hpsr-wine bg-white"
                        : "border-hpsr-border bg-white/[0.86] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-hpsr-text">{patient.name}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasses(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-hpsr-muted">
                          Passaporte {patient.passport} · {patient.age} anos · {patient.bloodType} · {patient.followUp}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-hpsr-wine transition ${selected ? "rotate-[-90deg]" : ""}`}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hpsr-border pt-3">
                      <MiniPatientStat label="Registros" value={String(events.length)} />
                      <MiniPatientStat label="Alertas" value={String(patient.alerts.length)} />
                      <MiniPatientStat label="Último" value={formatDate(patient.lastVisit)} />
                    </div>
                  </button>
                );
              })}

              {visiblePatients.length === 0 && (
                <div className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-3.5 text-center">
                  <p className="font-black text-hpsr-text">Nenhum paciente encontrado.</p>
                  <p className="mt-1 text-sm text-hpsr-muted">Tente buscar por outro nome ou passaporte.</p>
                </div>
              )}
            </div>
          </div>

          {selectedPatient ? (
            <div className="min-w-0 overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
              <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-hpsr-text">{selectedPatient.name}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(selectedPatient.status)}`}>
                        {selectedPatient.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-hpsr-muted">
                      Passaporte {selectedPatient.passport} · {selectedPatient.age} anos · Tipo sanguíneo {selectedPatient.bloodType} · {selectedPatient.cityPhone}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Regra de segurança</p>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">
                      Correções entram como nova observação, sem apagar histórico.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-[16px] border px-4 py-2.5 text-xs font-black transition ${
                        activeTab === tab.id
                          ? "border-hpsr-wine bg-[linear-gradient(135deg,#672614,#74321e)] text-white"
                          : "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fffdf9]"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {activeTab === "geral" && (
                  <OverviewTab
                    patient={selectedPatient}
                    events={patientEvents}
                    consultationCount={consultationCount}
                    examCount={examCount}
                    prescriptionCount={prescriptionCount}
                    procedureCount={procedureCount}
                  />
                )}
                {activeTab === "timeline" && <TimelineTab events={patientEvents} />}
                {activeTab === "consultas" && <FilteredEventsTab events={patientEvents} type="Consulta" empty="Nenhuma consulta registrada." />}
                {activeTab === "exames" && <FilteredEventsTab events={patientEvents} type="Exame" empty="Nenhum exame vinculado." />}
                {activeTab === "prescricoes" && <FilteredEventsTab events={patientEvents} type="Prescrição" empty="Nenhuma prescrição registrada." />}
                {activeTab === "procedimentos" && <FilteredEventsTab events={patientEvents} type="Procedimento" empty="Nenhum procedimento registrado." />}
                {activeTab === "observacoes" && <FilteredEventsTab events={patientEvents} type="Observação" empty="Nenhuma observação interna." />}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
              <div>
                <Search className="mx-auto text-hpsr-wine" size={30} />
                <h3 className="mt-3 text-lg font-black text-hpsr-text">Selecione ou pesquise um paciente</h3>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-hpsr-muted">
                  O prontuário completo só será exibido depois que um paciente for selecionado na lista ou localizado por uma pesquisa específica.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {isRegisterOpen && (
        <CreateRecordModal
          onClose={() => setIsRegisterOpen(false)}
          onSave={handleCreateRecord}
        />
      )}
    </div>
  );
}


function CreateRecordModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: {
    name: string;
    passport: string;
    age: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
    recordType: TimelineEvent["type"];
    recordTitle: string;
    recordSummary: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    passport: "",
    age: "",
    bloodType: "+A",
    cityPhone: "",
    followUp: "",
    recordType: "Consulta" as TimelineEvent["type"],
    recordTitle: "",
    recordSummary: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.passport.trim() || !form.age.trim() || !form.bloodType.trim()) {
      alert("Informe nome, passaporte, idade e tipo sanguíneo do paciente.");
      return;
    }

    if (!form.recordTitle.trim() || !form.recordSummary.trim()) {
      alert("Informe o título e o registro do prontuário médico.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar cadastro"
        onClick={onClose}
        className="absolute inset-0 bg-[#2a0700]/45"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-[980px] flex-col overflow-hidden rounded-[16px] border border-white/70 bg-[#fffaf4]"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2a0700_0%,#672614_54%,#a67a5f_100%)] p-3.5 text-white">
          <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                <ClipboardPlus size={14} />
                Novo registro
              </span>
              <h2 className="mt-3 text-lg font-black tracking-tight">Cadastrar paciente e registro do prontuário</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/84">
                Primeiro informe os dados do paciente. Depois registre a evolução, conduta ou observação feita pelo médico.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-3.5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
                Dados do paciente
              </p>

              <div className="mt-4 grid gap-3">
                <ModalField label="Nome do paciente">
                  <input
                    className={modalInputClass}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nome completo do paciente"
                  />
                </ModalField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ModalField label="Passaporte">
                    <input
                      className={modalInputClass}
                      value={form.passport}
                      onChange={(event) => updateField("passport", event.target.value)}
                      placeholder="Ex.: 876"
                    />
                  </ModalField>

                  <ModalField label="Idade">
                    <input
                      className={modalInputClass}
                      value={form.age}
                      onChange={(event) => updateField("age", event.target.value)}
                      placeholder="Ex.: 22"
                    />
                  </ModalField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ModalField label="Tipo sanguíneo">
                    <select
                      className={modalInputClass}
                      value={form.bloodType}
                      onChange={(event) => updateField("bloodType", event.target.value)}
                    >
                      <option value="+A">+A</option>
                      <option value="-A">-A</option>
                      <option value="+B">+B</option>
                      <option value="-B">-B</option>
                    </select>
                  </ModalField>

                  <ModalField label="Telefone na cidade">
                    <input
                      className={modalInputClass}
                      value={form.cityPhone}
                      onChange={(event) => updateField("cityPhone", event.target.value)}
                      placeholder="Ex.: (055) 193-000"
                    />
                  </ModalField>
                </div>

                <ModalField label="Acompanhamento">
                  <input
                    className={modalInputClass}
                    value={form.followUp}
                    onChange={(event) => updateField("followUp", event.target.value)}
                    placeholder="Ex.: Obstétrico, clínico, pediatria..."
                  />
                </ModalField>
              </div>
            </section>

            <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
                Registro do prontuário médico
              </p>

              <div className="mt-4 grid gap-3">
                <ModalField label="Tipo de registro">
                  <select
                    className={modalInputClass}
                    value={form.recordType}
                    onChange={(event) => updateField("recordType", event.target.value)}
                  >
                    <option value="Consulta">Consulta</option>
                    <option value="Exame">Exame</option>
                    <option value="Prescrição">Prescrição</option>
                    <option value="Procedimento">Procedimento</option>
                    <option value="Observação">Observação</option>
                  </select>
                </ModalField>

                <ModalField label="Título do registro">
                  <input
                    className={modalInputClass}
                    value={form.recordTitle}
                    onChange={(event) => updateField("recordTitle", event.target.value)}
                    placeholder="Ex.: Consulta obstétrica"
                  />
                </ModalField>

                <ModalField label="Registro / evolução médica">
                  <textarea
                    className={`${modalInputClass} min-h-[180px] resize-y leading-relaxed`}
                    value={form.recordSummary}
                    onChange={(event) => updateField("recordSummary", event.target.value)}
                    placeholder="Descreva queixa, achados relevantes, conduta, orientação, retorno ou observação interna."
                  />
                </ModalField>

                <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-800">
                  O registro será assinado como <strong>{currentUserProfile.systemName}</strong> e entrará na linha do tempo do prontuário.
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/[0.86] p-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition"
          >
            Salvar registro
          </button>
        </div>
      </form>
    </div>
  );
}

const modalInputClass =
  "min-w-0 w-full rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function OverviewTab({
  patient,
  events,
  consultationCount,
  examCount,
  prescriptionCount,
  procedureCount,
}: {
  patient: PatientRecord;
  events: TimelineEvent[];
  consultationCount: number;
  examCount: number;
  prescriptionCount: number;
  procedureCount: number;
}) {
  return (
    <div className="grid gap-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Consultas" value={String(consultationCount)} icon={<Stethoscope size={18} />} />
        <SummaryCard label="Exames" value={String(examCount)} icon={<FileText size={18} />} />
        <SummaryCard label="Prescrições" value={String(prescriptionCount)} icon={<Pill size={18} />} />
        <SummaryCard label="Procedimentos" value={String(procedureCount)} icon={<Syringe size={18} />} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
            Resumo do paciente
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoPill label="Acompanhamento" value={patient.followUp} />
            <InfoPill label="Último atendimento" value={formatDate(patient.lastVisit)} />
            <InfoPill label="Tipo sanguíneo" value={patient.bloodType} />
            <InfoPill label="Contato na cidade" value={patient.cityPhone} />
          </div>
        </div>

        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
            Alertas importantes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {patient.alerts.map((alert) => (
              <span key={alert} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">
                <AlertTriangle size={13} />
                {alert}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Últimos registros" description="Eventos mais recentes deste paciente." />
        <div className="mt-3 grid gap-3">
          {events.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <EmptyState text="Nenhum evento registrado neste prontuário." />;
  }

  return (
    <div className="relative grid gap-3">
      {events.map((event, index) => (
        <div key={event.id} className="grid gap-3 md:grid-cols-[44px_minmax(0,1fr)]">
          <div className="hidden md:flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hpsr-border bg-[#fff8f0]">
              {eventIcon(event.type)}
            </div>
            {index < events.length - 1 && <div className="mt-2 h-full min-h-[36px] w-px bg-hpsr-border" />}
          </div>
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

function FilteredEventsTab({
  events,
  type,
  empty,
}: {
  events: TimelineEvent[];
  type: TimelineEvent["type"];
  empty: string;
}) {
  const filtered = events.filter((event) => event.type === type);

  if (filtered.length === 0) return <EmptyState text={empty} />;

  return (
    <div className="grid gap-3">
      {filtered.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }: { event: TimelineEvent }) {
  return (
    <article className="rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-[#fff8f0] px-3 py-1 text-xs font-black text-hpsr-wine">
              {eventIcon(event.type)}
              {event.type}
            </span>
            <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-muted">
              {event.status}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-hpsr-text">{event.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{event.summary}</p>
        </div>

        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-sm lg:min-w-[210px]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Registro</p>
          <p className="mt-1 font-black text-hpsr-text">{formatDate(event.date)}</p>
          <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{event.doctor}</p>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">{label}</p>
        <span className="text-hpsr-wine">{icon}</span>
      </div>
      <p className="mt-2 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function GeneralMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">{label}</p>
        <span className="text-hpsr-wine">{icon}</span>
      </div>
      <p className="mt-2 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function MiniPatientStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function PatientCardInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white/[0.86] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-sm font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
      <div>
        <Archive className="mx-auto text-hpsr-wine" size={28} />
        <p className="mt-3 text-sm font-black text-hpsr-text">{text}</p>
      </div>
    </div>
  );
}
