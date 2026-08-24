"use client";

import { isClinicalProfessional } from "@/lib/clinical-scheduling";
import { createClient } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Baby,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Hospital,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

import {
  getProcedureLabel,
  getProcedureRule,
  procedureDurations,
  type DoctorOption,
  type ProcedureFormState,
  type ProcedureProfessional,
  type ProcedureType,
} from "@/lib/procedure-schedule";

const ScheduleProcedureModal = dynamic(
  () => import("@/components/dashboard/ScheduleProcedureModal").then((module) => module.ScheduleProcedureModal),
  { ssr: false },
);

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
  status: "solicitado" | "confirmado";
  observations?: string;
};

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

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60).toString().padStart(2, "0");
  const mins = (normalized % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function getEndTime(item: ProcedureRequest) {
  return minutesToTime(timeToMinutes(item.start) + procedureDurations[item.procedureType] * 60);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function hasRoomConflict(item: ProcedureRequest, procedures: ProcedureRequest[]) {
  const itemStart = timeToMinutes(item.start);
  const itemEnd = itemStart + procedureDurations[item.procedureType] * 60;

  return procedures.some((other) => {
    if (other.id === item.id) return false;
    if (other.date !== item.date || other.room !== item.room) return false;

    const otherStart = timeToMinutes(other.start);
    const otherEnd = otherStart + procedureDurations[other.procedureType] * 60;

    return itemStart < otherEnd && itemEnd > otherStart;
  });
}

function normalizeProfessionals(value: unknown): ProcedureProfessional[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const item = (entry || {}) as Record<string, unknown>;
      const name = String(item.name || "").trim();
      const id = String(item.id || "").trim();
      if (!name || !id) return null;
      return {
        id,
        name,
        passport: String(item.passport || "").trim(),
        role: String(item.role || "Médico").trim(),
        specialty: String(item.specialty || "").trim(),
      };
    })
    .filter(Boolean) as ProcedureProfessional[];
}

function procedureFromRow(row: Record<string, unknown>): ProcedureRequest {
  const procedureType = String(row.procedure_type || "procedimento-geral") as ProcedureType;
  const professionals = normalizeProfessionals(row.professionals);
  return {
    id: String(row.id || ""),
    passport: String(row.patient_passport || "").trim(),
    patient: String(row.patient_name || "Paciente").trim(),
    procedure: getProcedureLabel(procedureType),
    procedureType,
    responsible: professionals[0]?.name || "A definir",
    team: professionals.map((professional) => professional.name),
    professionals,
    room: String(row.room || "").trim(),
    date: String(row.procedure_date || ""),
    start: String(row.start_time || "").slice(0, 5),
    status: String(row.status || "solicitado") === "confirmado" ? "confirmado" : "solicitado",
    observations: String(row.observations || "").trim(),
  };
}

function sortProcedures(items: ProcedureRequest[]) {
  return [...items].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}

function readableError(caught: unknown) {
  if (caught instanceof Error) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) return String((caught as { message?: unknown }).message || "Falha desconhecida");
  return "Falha desconhecida";
}

let procedureLoadInFlight: Promise<ProcedureRequest[]> | null = null;
let doctorsLoadInFlight: Promise<DoctorOption[]> | null = null;
let doctorsCache: { savedAt: number; data: DoctorOption[] } | null = null;
const DOCTORS_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchProcedureRows() {
  if (procedureLoadInFlight) return procedureLoadInFlight;

  const request = (async () => {
    const client = createClient();
    if (!client) return [] as ProcedureRequest[];

    const { data, error } = await client
      .from("clinical_procedures")
      .select("id,patient_passport,patient_name,procedure_type,room,procedure_date,start_time,status,observations,professionals")
      .order("procedure_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return sortProcedures((data || []).map((row) => procedureFromRow(row as Record<string, unknown>)));
  })();

  procedureLoadInFlight = request;
  try {
    return await request;
  } finally {
    procedureLoadInFlight = null;
  }
}

async function fetchProcedureDoctors() {
  if (doctorsCache && Date.now() - doctorsCache.savedAt < DOCTORS_CACHE_TTL_MS) return doctorsCache.data;
  if (doctorsLoadInFlight) return doctorsLoadInFlight;

  const request = (async () => {
    const client = createClient();
    if (!client) return [] as DoctorOption[];

    const { data, error } = await client
      .from("profiles")
      .select("id,name,passport,role,specialty,crm")
      .eq("access_status", "Aprovado")
      .order("name");

    if (error) throw error;

    const available = (data || [])
      .filter((row) => isClinicalProfessional(row))
      .map((row) => ({
        id: String(row.id || ""),
        name: String(row.name || "Médico").trim(),
        passport: String(row.passport || "").trim(),
        role: String(row.role || "Médico").trim(),
        specialty: String(row.specialty || "").trim(),
      }))
      .filter((doctor) => doctor.id && doctor.name)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    doctorsCache = { savedAt: Date.now(), data: available };
    return available;
  })();

  doctorsLoadInFlight = request;
  try {
    return await request;
  } finally {
    doctorsLoadInFlight = null;
  }
}

export default function ProcedureSchedulePage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [procedures, setProcedures] = useState<ProcedureRequest[]>([]);
  const [proceduresLoading, setProceduresLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRequest | null>(null);

  const canScheduleProcedures = useMemo(() => {
    const roles = [currentUserProfile.role, currentUserProfile.systemRole];
    return roles.some((role) => ["Diretora", "Vice Diretor", "Vice-Diretor", "Diretor Técnico / Dev"].includes(role));
  }, [currentUserProfile.role, currentUserProfile.systemRole]);

  const loadProcedures = useCallback(async () => {
    setProceduresLoading(true);
    try {
      setProcedures(await fetchProcedureRows());
    } catch (caught) {
      const message = readableError(caught);
      console.error("[HPSR] Falha ao carregar procedimentos:", message);
      void hpsrAlert(`Não foi possível carregar a agenda de procedimentos: ${message}`, "Agenda de procedimentos");
    } finally {
      setProceduresLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProcedures();

    const client = createClient();
    if (!client) return;

    const channel = client
      .channel("clinical-procedures-shared")
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_procedures" }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          const removedId = String(payload.old?.id || "");
          setProcedures((current) => current.filter((item) => item.id !== removedId));
          return;
        }

        const next = procedureFromRow((payload.new || {}) as Record<string, unknown>);
        if (!next.id) return;
        setProcedures((current) => sortProcedures([...current.filter((item) => item.id !== next.id), next]));
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loadProcedures]);

  useEffect(() => {
    const modalNeedsDoctors = canScheduleProcedures && (scheduleOpen || Boolean(editingProcedure));
    if (!modalNeedsDoctors) return;

    let active = true;
    setDoctorsLoading(true);
    void fetchProcedureDoctors()
      .then((available) => {
        if (!active) return;
        setDoctors(available);
      })
      .catch((caught) => {
        if (!active) return;
        const message = readableError(caught);
        console.error("[HPSR] Falha ao carregar profissionais para procedimentos:", message);
        void hpsrAlert(`Não foi possível carregar os médicos: ${message}`, "Agenda de procedimentos");
      })
      .finally(() => {
        if (active) setDoctorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canScheduleProcedures, editingProcedure, scheduleOpen]);

  async function handleCreateProcedure(form: ProcedureFormState) {
    const professionals = form.professionals.filter((professional) => professional.id && professional.name.trim());
    if (!form.patient.trim() || !form.passport.trim()) {
      await hpsrAlert("Selecione um paciente cadastrado para o procedimento.", "Paciente obrigatório");
      return;
    }
    if (!professionals.length) {
      await hpsrAlert("Selecione pelo menos um médico para o procedimento.", "Equipe obrigatória");
      return;
    }

    const candidate: ProcedureRequest = {
      id: "novo",
      passport: form.passport.trim(),
      patient: form.patient.trim(),
      procedure: getProcedureLabel(form.procedureType),
      procedureType: form.procedureType,
      responsible: professionals[0].name,
      team: professionals.map((professional) => professional.name),
      professionals,
      room: form.room,
      date: form.date,
      start: form.start,
      status: "solicitado",
      observations: form.observations.trim(),
    };

    if (hasRoomConflict(candidate, procedures)) {
      await hpsrAlert("Já existe outro procedimento usando esta sala dentro do mesmo intervalo.", "Conflito de sala");
      return;
    }

    const client = createClient();
    if (!client) return;
    const { data, error } = await client
      .from("clinical_procedures")
      .insert({
        patient_passport: candidate.passport,
        patient_name: candidate.patient,
        procedure_type: candidate.procedureType,
        room: candidate.room,
        procedure_date: candidate.date,
        start_time: candidate.start,
        status: "solicitado",
        observations: candidate.observations || null,
        professionals,
      })
      .select("id,patient_passport,patient_name,procedure_type,room,procedure_date,start_time,status,observations,professionals")
      .single();

    if (error) {
      await hpsrAlert(`Não foi possível agendar o procedimento: ${error.message}`, "Agendamento não salvo");
      return;
    }

    const saved = procedureFromRow(data as Record<string, unknown>);
    setProcedures((current) => sortProcedures([...current.filter((item) => item.id !== saved.id), saved]));
    setScheduleOpen(false);
  }

  async function handleUpdateProcedure(form: ProcedureFormState) {
    if (!editingProcedure) return;
    const professionals = form.professionals.filter((professional) => professional.id && professional.name.trim());
    if (!form.patient.trim() || !form.passport.trim()) {
      await hpsrAlert("Selecione um paciente cadastrado para o procedimento.", "Paciente obrigatório");
      return;
    }
    if (!professionals.length) {
      await hpsrAlert("Selecione pelo menos um médico para o procedimento.", "Equipe obrigatória");
      return;
    }

    const candidate: ProcedureRequest = {
      ...editingProcedure,
      passport: form.passport.trim(),
      patient: form.patient.trim(),
      procedure: getProcedureLabel(form.procedureType),
      procedureType: form.procedureType,
      responsible: professionals[0].name,
      team: professionals.map((professional) => professional.name),
      professionals,
      room: form.room,
      date: form.date,
      start: form.start,
      observations: form.observations.trim(),
      status: "solicitado",
    };

    if (hasRoomConflict(candidate, procedures)) {
      await hpsrAlert("Já existe outro procedimento usando esta sala dentro do mesmo intervalo.", "Conflito de sala");
      return;
    }

    const client = createClient();
    if (!client) return;
    const { data, error } = await client
      .from("clinical_procedures")
      .update({
        patient_passport: candidate.passport,
        patient_name: candidate.patient,
        procedure_type: candidate.procedureType,
        room: candidate.room,
        procedure_date: candidate.date,
        start_time: candidate.start,
        status: "solicitado",
        observations: candidate.observations || null,
        professionals,
        updated_by: currentUserProfile.id || null,
      })
      .eq("id", editingProcedure.id)
      .select("id,patient_passport,patient_name,procedure_type,room,procedure_date,start_time,status,observations,professionals")
      .single();

    if (error) {
      await hpsrAlert(`Não foi possível atualizar o procedimento: ${error.message}`, "Alteração não salva");
      return;
    }

    const saved = procedureFromRow(data as Record<string, unknown>);
    setProcedures((current) => sortProcedures([...current.filter((item) => item.id !== saved.id), saved]));
    setEditingProcedure(null);
  }

  async function analyzeProcedure(item: ProcedureRequest) {
    const conflict = hasRoomConflict(item, procedures);
    if (conflict) {
      await hpsrAlert("Não é possível confirmar enquanto houver conflito de sala.", "Conflito de agendamento");
      return;
    }
    if (!(await hpsrConfirm(`Confirmar o procedimento de ${item.patient}?`, "Confirmar procedimento"))) return;

    const client = createClient();
    if (!client) return;
    const { error } = await client
      .from("clinical_procedures")
      .update({ status: "confirmado", updated_by: currentUserProfile.id || null })
      .eq("id", item.id);

    if (error) {
      await hpsrAlert(`Não foi possível confirmar o procedimento: ${error.message}`, "Confirmação não salva");
      return;
    }

    setProcedures((current) => current.map((procedure) => procedure.id === item.id ? { ...procedure, status: "confirmado" } : procedure));
  }

  return (
    <div className="hpsr-page max-w-[1500px] gap-3">
      <PageHeader
        eyebrow="Agendamentos"
        title="Agenda de Procedimentos"
        description="Visão compartilhada dos procedimentos, pacientes e médicos escalados."
      />

      <section className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-hpsr-text lg:px-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine">
              <ShieldAlert size={15} />
              Centro de procedimentos
            </span>
            <h2 className="mt-2 max-w-4xl text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight tracking-tight">
              Procedimentos organizados com paciente, sala e equipe médica definida
            </h2>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-hpsr-muted">
              Toda a equipe pode acompanhar os procedimentos agendados. Criação, edição e confirmação ficam restritas à Direção responsável pela agenda.
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

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
          <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#a67a5f)] text-white">
                <Hospital size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-hpsr-text">Procedimentos agendados</h2>
                <p className="text-xs text-hpsr-muted">Resumo compartilhado com paciente, horário, sala e médicos escalados.</p>
              </div>
            </div>

            <span className="rounded-2xl border border-hpsr-border bg-white/[0.86] px-3 py-2 text-xs font-semibold text-hpsr-wine">
              {procedures.length} {procedures.length === 1 ? "procedimento" : "procedimentos"}
            </span>
          </div>

          <div className="grid gap-3 p-3.5">
            {proceduresLoading ? (
              <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm font-semibold text-hpsr-muted">
                <Loader2 size={18} className="animate-spin" />
                Carregando procedimentos...
              </div>
            ) : procedures.length === 0 ? (
              <div className="grid min-h-[220px] place-items-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fffaf4] p-6 text-center">
                <div>
                  <Hospital size={28} className="mx-auto text-hpsr-wineLight" />
                  <h3 className="mt-3 text-base font-black text-hpsr-text">Nenhum procedimento agendado</h3>
                  <p className="mt-1 text-sm text-hpsr-muted">Quando a Direção registrar um procedimento, ele aparecerá aqui para toda a equipe.</p>
                </div>
              </div>
            ) : procedures.map((item) => {
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

                  <div className="grid gap-3 p-3.5 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-stretch">
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
                        {item.patient} · Passaporte {item.passport}
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <InfoPill icon={<CalendarClock size={14} />} label="Data" value={formatDate(item.date)} />
                        <InfoPill icon={<Clock3 size={14} />} label="Horário" value={`${item.start} às ${getEndTime(item)}`} />
                        <InfoPill icon={<MapPin size={14} />} label="Sala" value={item.room} />
                      </div>

                      <div className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] px-4 py-3">
                        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                          <UsersRound size={14} />
                          Médicos escalados
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {item.professionals.map((professional, index) => (
                            <div key={professional.id} className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-black text-hpsr-text">{professional.name}</p>
                                  <p className="mt-0.5 truncate text-[11px] font-semibold text-hpsr-muted">
                                    {professional.specialty || professional.role || "Corpo médico"}
                                  </p>
                                </div>
                                {index === 0 && (
                                  <span className="shrink-0 rounded-full bg-[#f7ede3] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-hpsr-wine">
                                    Responsável
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {item.observations && (
                        <p className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-xs font-semibold text-hpsr-muted">
                          <strong className="text-hpsr-wine">Resumo:</strong> {item.observations}
                        </p>
                      )}

                      {conflict && (
                        <p className="mt-3 inline-flex items-start gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                          Existe outro procedimento usando a mesma sala dentro deste intervalo. A confirmação fica bloqueada até o ajuste.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col justify-between rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">Responsável</p>
                        <p className="mt-1 text-sm font-black text-hpsr-text">{item.responsible}</p>
                        <p className="mt-2 text-xs text-hpsr-muted">{item.professionals.length} {item.professionals.length === 1 ? "médico escalado" : "médicos escalados"}</p>
                      </div>

                      {canScheduleProcedures ? (
                        <div className="mt-4 grid gap-2">
                          {item.status !== "confirmado" && (
                            <button
                              type="button"
                              onClick={() => void analyzeProcedure(item)}
                              title="Confirmar procedimento"
                              className="rounded-2xl bg-[linear-gradient(135deg,#672614,#74321e)] px-3 py-2.5 text-xs font-semibold text-white transition"
                            >
                              Confirmar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingProcedure(item)}
                            title="Editar procedimento"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-hpsr-border bg-white px-3 py-2.5 text-xs font-semibold text-hpsr-wine transition hover:bg-[#fffaf4]"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[14px] border border-hpsr-border bg-white px-3 py-2.5 text-xs font-semibold text-hpsr-muted">
                          Visualização liberada. Alterações são restritas à Direção.
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
                <UsersRound size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Visibilidade</p>
                <h3 className="text-lg font-bold text-hpsr-text">Resumo para a equipe</h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-hpsr-muted">
              Médicos e demais membros do hospital consultam paciente, horário, sala, status e profissionais escalados sem poder alterar o agendamento.
            </p>
            <div className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] px-3 py-2.5 text-xs font-bold text-hpsr-wine">
              {canScheduleProcedures ? "Seu perfil possui permissão de gestão." : "Seu perfil possui acesso somente para consulta."}
            </div>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fcf6ee] text-hpsr-wine">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Equipe mínima</p>
                <h3 className="text-lg font-bold text-hpsr-text">Checklist</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <ChecklistItem title="Partos e cesáreas" description="Obstetra, apoio neonatal quando aplicável e sala definida." />
              <ChecklistItem title="Procedimentos gerais" description="Médico responsável, equipe compatível e sala disponível por 2h." />
              <ChecklistItem title="FIV" description="Especialista responsável, apoio clínico e sala por 1h." />
            </div>
          </div>
        </aside>
      </section>

      {scheduleOpen && (
        <ScheduleProcedureModal
          doctors={doctors}
          doctorsLoading={doctorsLoading}
          onClose={() => setScheduleOpen(false)}
          onSave={handleCreateProcedure}
        />
      )}
      {editingProcedure && (
        <ScheduleProcedureModal
          doctors={doctors}
          doctorsLoading={doctorsLoading}
          initialForm={{
            patient: editingProcedure.patient,
            passport: editingProcedure.passport,
            procedureType: editingProcedure.procedureType,
            room: editingProcedure.room,
            date: editingProcedure.date,
            start: editingProcedure.start,
            observations: editingProcedure.observations || "",
            professionals: editingProcedure.professionals,
          }}
          title="Editar procedimento"
          onClose={() => setEditingProcedure(null)}
          onSave={handleUpdateProcedure}
        />
      )}
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
