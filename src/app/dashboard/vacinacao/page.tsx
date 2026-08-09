"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, ShieldCheck, Syringe, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";
import {
  assignApplicationsToSlots,
  commonVaccines,
  doseOptions,
  getVaccinationCardDefinition,
  suggestVaccinationGroup,
  type AdultCardVariant,
  type VaccinationApplication,
  type VaccinationGroup,
} from "@/lib/vaccination";

const inputClass = "min-h-[44px] w-full rounded-[13px] border border-hpsr-border bg-white px-3 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine/50 focus:ring-2 focus:ring-hpsr-wine/10";


type DoctorOption = {
  id: string;
  name: string;
  crm: string;
  signatureImage: string | null;
};

function formatDate(value: string) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function parseVaccineRow(row: any): VaccinationApplication | null {
  const payload = row?.payload || {};
  const vaccine = payload?.vaccine || {};
  const doctor = payload?.doctor || {};
  const patient = payload?.patient || {};
  if (!vaccine?.name) return null;
  return {
    id: String(row.id),
    patientPassport: String(row.patient_passport || patient.passport || ""),
    patientName: String(patient.name || payload.patientName || "Paciente"),
    group: (vaccine.group || "adulto") as VaccinationGroup,
    adultVariant: vaccine.adultVariant as AdultCardVariant | undefined,
    vaccine: String(vaccine.name || ""),
    dose: String(vaccine.dose || ""),
    date: String(vaccine.date || ""),
    lot: String(vaccine.lot || ""),
    observation: String(vaccine.observation || ""),
    doctorName: String(doctor.name || payload.doctorName || "Médico responsável"),
    doctorCrm: String(doctor.crm || payload.doctorCrm || "—"),
    signatureImage: doctor.signatureImage || null,
    createdAt: String(row.created_at || ""),
    createdBy: String(row.created_by || ""),
  };
}

function Stamp({ app, compact = false }: { app: VaccinationApplication; compact?: boolean }) {
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-full border-[2px] border-dashed border-[#1d58a7]/80 text-center text-[#1d58a7] ${compact ? "h-[58px] w-[58px]" : "h-[78px] w-[78px]"}`} style={{ transform: "rotate(-3deg)", opacity: .88 }}>
      <img src="/logo-hpsr.png" alt="HP" className={`${compact ? "h-4 w-4" : "h-5 w-5"} object-contain opacity-75`} style={{ filter: "brightness(0) saturate(100%) invert(31%) sepia(59%) saturate(1468%) hue-rotate(181deg) brightness(82%) contrast(93%)" }} />
      <div className="absolute inset-x-1 top-[47%] -translate-y-1/2 text-[6px] font-black uppercase leading-tight">{app.doctorName}</div>
      <div className="absolute inset-x-1 bottom-[5px] text-[6px] font-black">CRM {app.doctorCrm}</div>
      {app.signatureImage && <img src={app.signatureImage} alt="Assinatura" className="absolute bottom-[17px] h-[14px] w-[46px] object-contain opacity-80" style={{ filter: "brightness(0) saturate(100%) invert(31%) sepia(59%) saturate(1468%) hue-rotate(181deg) brightness(82%) contrast(93%)" }} />}
    </div>
  );
}

function CardPreview({
  group,
  adultVariant,
  applications,
  patientName,
  passport,
  birthDate,
  guardians,
  page,
}: {
  group: VaccinationGroup;
  adultVariant: AdultCardVariant;
  applications: VaccinationApplication[];
  patientName: string;
  passport: string;
  birthDate: string;
  guardians: string;
  page: number;
}) {
  const def = getVaccinationCardDefinition(group, adultVariant);
  const start = page * def.slots.length;
  const pageApps = applications.slice(start, start + def.slots.length);
  const assigned = assignApplicationsToSlots(pageApps, def);

  return (
    <div className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[18px] border border-hpsr-border bg-white shadow-soft" style={{ aspectRatio: `${def.width}/${def.height}` }}>
      <img src={def.template} alt="Modelo da caderneta" className="absolute inset-0 h-full w-full object-fill" />

      {group === "adulto" && (
        <>
          <div className="absolute left-[11%] top-[23.7%] w-[42%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{patientName}</div>
          <div className="absolute left-[14%] top-[29.2%] w-[38%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{passport}</div>
          <div className="absolute left-[20%] top-[33.7%] w-[32%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{formatDate(birthDate)}</div>
        </>
      )}
      {group === "idoso" && (
        <>
          <div className="absolute left-[10%] top-[24.0%] w-[50%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{patientName}</div>
          <div className="absolute left-[11%] top-[29.4%] w-[27%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{passport}</div>
          <div className="absolute left-[49%] top-[29.4%] w-[18%] text-[1.05vw] font-bold text-[#5a260f] max-[900px]:text-[1.35vw]">{formatDate(birthDate)}</div>
        </>
      )}

      {group === "crianca" && (
        <>
          <div className="absolute left-[31%] top-[7.5%] rounded bg-[#c9a98e]/90 px-2 py-0.5 text-[1.25vw] font-black text-white max-[900px]:text-[1.55vw]">{patientName}</div>
          <div className="absolute left-[31%] top-[12.2%] rounded bg-[#c9a98e]/90 px-2 py-0.5 text-[1.15vw] font-black text-white max-[900px]:text-[1.45vw]">{passport}</div>
          <div className="absolute left-[42%] top-[16.8%] rounded bg-[#c9a98e]/90 px-2 py-0.5 text-[1.05vw] font-black text-white max-[900px]:text-[1.35vw]">{formatDate(birthDate)}</div>
          <div className="absolute left-[44%] top-[21.2%] max-w-[37%] rounded bg-[#c9a98e]/90 px-2 py-0.5 text-[1.0vw] font-black text-white max-[900px]:text-[1.3vw]">{guardians || "Responsável não vinculado"}</div>
        </>
      )}

      {group === "gestante" && (
        <>
          <div className="absolute left-[8.7%] top-[21.4%] w-[31%] bg-white/95 px-1 text-[1.0vw] font-bold text-[#672614] max-[900px]:text-[1.3vw]">{patientName}</div>
          <div className="absolute left-[13.6%] top-[26.0%] w-[26%] bg-white/95 px-1 text-[1.0vw] font-bold text-[#672614] max-[900px]:text-[1.3vw]">{passport}</div>
        </>
      )}

      {def.slots.map((slot) => {
        const app = assigned.get(slot.id);
        if (!app) return null;
        return (
          <div key={slot.id} className="absolute overflow-hidden text-[#5a260f]" style={{ left: `${slot.left}%`, top: `${slot.top}%`, width: `${slot.width}%`, height: `${slot.height}%` }}>
            {(group === "adulto" || group === "idoso") ? (
              <>
                <div className="absolute left-[21%] top-[4%] right-[4%] truncate text-[clamp(6px,0.72vw,10px)] font-black">{app.vaccine}</div>
                <div className="absolute left-[21%] top-[18%] right-[4%] truncate text-[clamp(6px,0.72vw,10px)] font-bold">{app.dose}</div>
                <div className="absolute left-[21%] top-[32%] right-[4%] truncate text-[clamp(6px,0.72vw,10px)] font-bold">{formatDate(app.date)}</div>
                <div className="absolute left-[21%] top-[46%] right-[4%] truncate text-[clamp(6px,0.72vw,10px)] font-bold">{app.lot || "—"}</div>
                <div className="absolute bottom-[2%] left-[4%] right-[4%] flex items-end justify-between gap-1">
                  <span className="line-clamp-2 max-w-[58%] text-[clamp(5px,0.58vw,8px)] font-semibold">{app.observation || ""}</span>
                  <Stamp app={app} compact />
                </div>
              </>
            ) : (
              <div className="relative flex h-full items-start justify-between gap-1 p-[4%]">
                <div className="min-w-0 flex-1 text-[clamp(6px,0.7vw,10px)] font-bold leading-[1.25]">
                  <p className="truncate font-black">{app.vaccine}</p>
                  <p>{app.dose}</p>
                  <p>{formatDate(app.date)}</p>
                  {app.lot && <p className="truncate">Lote {app.lot}</p>}
                  {app.observation && <p className="mt-0.5 line-clamp-2 text-[.88em] font-semibold">{app.observation}</p>}
                </div>
                <Stamp app={app} compact />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VaccinationPage() {
  const { patients, loading: patientsLoading, selectedPatient, selectedPassport, selectPatient } = usePatientSelection();
  const { profile } = useCurrentUserProfile();
  const [group, setGroup] = useState<VaccinationGroup>("adulto");
  const [adultVariant, setAdultVariant] = useState<AdultCardVariant>("masculino");
  const [vaccine, setVaccine] = useState("");
  const [dose, setDose] = useState("1ª dose");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lot, setLot] = useState("");
  const [observation, setObservation] = useState("");
  const [history, setHistory] = useState<VaccinationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [guardians, setGuardians] = useState("");
  const [page, setPage] = useState(0);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    if (selectedPatient) setGroup(suggestVaccinationGroup(selectedPatient.age));
  }, [selectedPatient?.passport]);

  useEffect(() => {
    const currentDoctor: DoctorOption = {
      id: profile.id || "current-user",
      name: profile.characterName || profile.signatureName || "Médico",
      crm: profile.crm || "—",
      signatureImage: profile.signatureImage || null,
    };
    setSelectedDoctorId((current) => current || currentDoctor.id);
    const client = createClient();
    if (!client) { setAvailableDoctors([currentDoctor]); return; }
    void client.from("profiles").select("id,name,crm,signature_path").eq("access_status", "Aprovado").order("name").then(({ data }) => {
      const options: DoctorOption[] = (data || []).map((row: any) => {
        const signaturePath = String(row.signature_path || "").trim();
        let signatureImage: string | null = signaturePath || null;
        if (signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
          const { data: publicData } = client.storage.from("signatures").getPublicUrl(signaturePath);
          signatureImage = publicData.publicUrl || signaturePath;
        }
        return { id: String(row.id), name: String(row.name || "Médico"), crm: String(row.crm || "—"), signatureImage };
      });
      setAvailableDoctors([currentDoctor, ...options.filter((item) => item.id !== currentDoctor.id)]);
    });
  }, [profile.id, profile.characterName, profile.signatureName, profile.crm, profile.signatureImage]);

  const selectedDoctor = useMemo(
    () => availableDoctors.find((doctor) => doctor.id === selectedDoctorId) || availableDoctors[0] || null,
    [availableDoctors, selectedDoctorId],
  );

  async function loadHistory(passport = selectedPassport) {
    if (!passport) { setHistory([]); return; }
    const client = createClient();
    if (!client) return;
    setLoading(true);
    const [recordsResult, registryResult, guardianResult] = await Promise.all([
      client.from("clinical_records").select("id,patient_passport,payload,created_at,created_by").eq("patient_passport", passport).eq("record_type", "Vacina").order("created_at", { ascending: true }),
      client.from("patient_registry").select("birth_date").eq("passport", passport).maybeSingle(),
      client.from("patient_guardian_links").select("guardian_passport,relationship").eq("child_passport", passport).eq("access_status", "authorized"),
    ]);
    if (recordsResult.error) await hpsrAlert(recordsResult.error.message, "Não foi possível carregar o histórico vacinal");
    setHistory((recordsResult.data || []).map(parseVaccineRow).filter(Boolean) as VaccinationApplication[]);
    setBirthDate(String((registryResult.data as any)?.birth_date || ""));
    const linked = (guardianResult.data || []) as any[];
    if (linked.length) {
      const passports = linked.map((row) => String(row.guardian_passport || "")).filter(Boolean);
      const { data: names } = await client.from("patient_registry").select("passport,name").in("passport", passports);
      const map = new Map((names || []).map((row: any) => [String(row.passport), String(row.name || row.passport)]));
      setGuardians(linked.map((row) => `${map.get(String(row.guardian_passport)) || row.guardian_passport} (${row.relationship})`).join(", "));
    } else setGuardians("");
    setLoading(false);
  }

  useEffect(() => { void loadHistory(); }, [selectedPassport]);

  const groupHistory = useMemo(() => history.filter((item) => item.group === group), [history, group]);
  const def = getVaccinationCardDefinition(group, adultVariant);
  const pageCount = Math.max(1, Math.ceil(groupHistory.length / def.slots.length));
  useEffect(() => setPage(Math.max(0, pageCount - 1)), [group, selectedPassport, pageCount]);

  async function saveApplication() {
    if (!selectedPatient) return void hpsrAlert("Selecione um paciente antes de registrar a vacina.", "Paciente obrigatório");
    if (!vaccine.trim() || !dose || !date) return void hpsrAlert("Informe vacina, dose e data da aplicação.", "Preenchimento incompleto");
    if (!selectedDoctor) return void hpsrAlert("Selecione o médico responsável pela aplicação.", "Médico obrigatório");
    if (!selectedDoctor.crm || selectedDoctor.crm === "—") return void hpsrAlert("O médico responsável precisa ter CRM cadastrado para gerar o carimbo.", "CRM obrigatório");
    if (!selectedDoctor.signatureImage) return void hpsrAlert("O médico responsável precisa ter uma assinatura cadastrada para compor o carimbo.", "Assinatura obrigatória");
    const duplicate = history.some((item) => item.vaccine.trim().toLowerCase() === vaccine.trim().toLowerCase() && item.dose === dose && item.date === date);
    if (duplicate) return void hpsrAlert("Já existe uma aplicação desta vacina, nesta dose e nesta data para o paciente.", "Aplicação duplicada");

    const client = createClient();
    if (!client) return;
    setSaving(true);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = {
      title: `Vacinação · ${vaccine.trim()} · ${dose}`,
      summary: `${vaccine.trim()} · ${dose} · ${formatDate(date)}`,
      patient: { name: selectedPatient.name, passport: selectedPatient.passport, birthDate, guardian: group === "crianca" ? guardians.trim() : undefined },
      patientName: selectedPatient.name,
      patientPassport: selectedPatient.passport,
      guardianName: group === "crianca" ? guardians.trim() : undefined,
      vaccine: { name: vaccine.trim(), dose, date, lot: lot.trim(), observation: observation.trim(), group, adultVariant: group === "adulto" ? adultVariant : undefined },
      doctor: { name: selectedDoctor.name, crm: selectedDoctor.crm, signatureImage: selectedDoctor.signatureImage },
      doctorName: selectedDoctor.name,
      doctorCrm: selectedDoctor.crm,
      cardModel: group === "adulto" ? `adulto-${adultVariant}` : group,
      releasedToPatient: true,
    };
    const { error } = await client.from("clinical_records").insert({
      id,
      patient_passport: selectedPatient.passport,
      record_type: "Vacina",
      payload,
      created_by: profile.id || null,
      is_confidential: false,
      released_at: now,
      created_at: now,
      updated_at: now,
    });
    setSaving(false);
    if (error) return void hpsrAlert(error.message, "Não foi possível registrar a vacina");
    setVaccine(""); setLot(""); setObservation("");
    await loadHistory(selectedPatient.passport);
  }

  async function removeApplication(item: VaccinationApplication) {
    const confirmed = await hpsrConfirm(`Excluir o registro de ${item.vaccine} (${item.dose})?`, "Excluir aplicação");
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("clinical_records").delete().eq("id", item.id).eq("record_type", "Vacina");
    if (error) return void hpsrAlert(error.message, "Não foi possível excluir");
    await loadHistory(item.patientPassport);
  }

  async function exportCard() {
    if (!selectedPatient) return;
    const definition = getVaccinationCardDefinition(group, adultVariant);
    const pageApps = groupHistory.slice(page * definition.slots.length, (page + 1) * definition.slots.length);
    const assigned = assignApplicationsToSlots(pageApps, definition);

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });

    try {
      const template = await loadImage(definition.template);
      const canvas = document.createElement("canvas");
      canvas.width = definition.width;
      canvas.height = definition.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível");
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
      const brown = "#5a260f";
      const blue = "#1d58a7";
      const px = (percent: number, axis: "x" | "y") => percent / 100 * (axis === "x" ? canvas.width : canvas.height);
      const write = (value: string, x: number, y: number, size: number, color = brown, weight = "700", maxWidth?: number) => {
        ctx.fillStyle = color; ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.textBaseline = "top";
        ctx.fillText(value || "", x, y, maxWidth);
      };

      if (group === "adulto") {
        write(selectedPatient.name, px(11, "x"), px(23.7, "y"), 20, brown, "700", px(42, "x"));
        write(selectedPatient.passport, px(14, "x"), px(29.2, "y"), 20, brown, "700", px(38, "x"));
        write(formatDate(birthDate), px(20, "x"), px(33.7, "y"), 20, brown, "700", px(32, "x"));
      } else if (group === "idoso") {
        write(selectedPatient.name, px(10, "x"), px(24, "y"), 20, brown, "700", px(50, "x"));
        write(selectedPatient.passport, px(11, "x"), px(29.4, "y"), 20, brown, "700", px(27, "x"));
        write(formatDate(birthDate), px(49, "x"), px(29.4, "y"), 20, brown, "700", px(18, "x"));
      } else if (group === "crianca") {
        write(selectedPatient.name, px(31, "x"), px(7.5, "y"), 18, "#ffffff", "800", px(40, "x"));
        write(selectedPatient.passport, px(31, "x"), px(12.2, "y"), 17, "#ffffff", "800", px(38, "x"));
        write(formatDate(birthDate), px(42, "x"), px(16.8, "y"), 16, "#ffffff", "800", px(30, "x"));
        write(guardians || "Responsável não vinculado", px(44, "x"), px(21.2, "y"), 14, "#ffffff", "800", px(36, "x"));
      } else {
        write(selectedPatient.name, px(8.7, "x"), px(21.4, "y"), 16, "#672614", "700", px(31, "x"));
        write(selectedPatient.passport, px(13.6, "x"), px(26, "y"), 16, "#672614", "700", px(26, "x"));
      }

      const logo = await loadImage("/logo-hpsr.png").catch(() => null);
      for (const slot of definition.slots) {
        const app = assigned.get(slot.id);
        if (!app) continue;
        const x = px(slot.left, "x"), y = px(slot.top, "y"), w = px(slot.width, "x"), h = px(slot.height, "y");
        if (group === "adulto" || group === "idoso") {
          const vx = x + w * .21;
          write(app.vaccine, vx, y + h * .04, Math.max(11, w * .035), brown, "800", w * .74);
          write(app.dose, vx, y + h * .18, Math.max(11, w * .035), brown, "700", w * .74);
          write(formatDate(app.date), vx, y + h * .32, Math.max(11, w * .035), brown, "700", w * .74);
          write(app.lot || "—", vx, y + h * .46, Math.max(11, w * .035), brown, "700", w * .74);
        } else {
          write(app.vaccine, x + w * .05, y + h * .05, Math.max(10, w * .04), brown, "800", w * .55);
          write(app.dose, x + w * .05, y + h * .20, Math.max(9, w * .036), brown, "700", w * .55);
          write(formatDate(app.date), x + w * .05, y + h * .34, Math.max(9, w * .036), brown, "700", w * .55);
          if (app.lot) write(`Lote ${app.lot}`, x + w * .05, y + h * .48, Math.max(8, w * .032), brown, "700", w * .55);
        }

        const radius = Math.min(w, h) * ((group === "crianca" || (slot.stampScale || 1) < 1) ? .18 : .20);
        const cx = x + w - radius * 1.25, cy = y + h - radius * 1.25;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-3 * Math.PI / 180); ctx.strokeStyle = blue; ctx.fillStyle = blue; ctx.globalAlpha = .86;
        ctx.lineWidth = Math.max(2, radius * .04); ctx.setLineDash([radius * .12, radius * .06]); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        if (logo) { ctx.globalAlpha = .72; ctx.drawImage(logo, -radius * .22, -radius * .44, radius * .44, radius * .44); }
        ctx.globalAlpha = .88; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 ${Math.max(7, radius * .15)}px Arial, sans-serif`;
        ctx.fillText(app.doctorName.slice(0, 28), 0, radius * .08, radius * 1.55);
        ctx.font = `800 ${Math.max(7, radius * .14)}px Arial, sans-serif`; ctx.fillText(`CRM ${app.doctorCrm}`, 0, radius * .67, radius * 1.5);
        if (app.signatureImage) {
          const signature = await loadImage(app.signatureImage).catch(() => null);
          if (signature) { ctx.globalAlpha = .78; ctx.drawImage(signature, -radius * .55, radius * .22, radius * 1.1, radius * .30); }
        }
        ctx.restore();
      }

      const anchor = document.createElement("a");
      const safeName = selectedPatient.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      anchor.download = `caderneta-vacinacao-${safeName || selectedPatient.passport}-p${page + 1}.png`;
      anchor.href = canvas.toDataURL("image/png", 1);
      anchor.click();
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Não foi possível gerar a imagem.", "Falha ao gerar PNG");
    }
  }

  return (
    <div className="hpsr-page gap-3">
      <PageHeader eyebrow="Vacinação" title="Vacinação" description="Registro de aplicações, histórico e caderneta automática por paciente." />

      <div className="grid gap-3 2xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2"><Syringe size={18} className="text-hpsr-wine"/><h2 className="font-black text-hpsr-text">Registrar vacina</h2></div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-black text-hpsr-muted">Paciente
                <StyledSelect value={selectedPassport} onChange={(e) => selectPatient(e.target.value || null)} className={`${inputClass} mt-1`} disabled={patientsLoading}>
                  <option value="">Selecione</option>{patients.map((p) => <option key={p.passport} value={p.passport}>{p.name} · {p.passport}</option>)}
                </StyledSelect>
              </label>
              <label className="block text-xs font-black text-hpsr-muted">Grupo da caderneta
                <StyledSelect value={group} onChange={(e) => setGroup(e.target.value as VaccinationGroup)} className={`${inputClass} mt-1`}>
                  <option value="adulto">Adulto</option><option value="crianca">Criança</option><option value="gestante">Gestante</option><option value="idoso">Idoso</option>
                </StyledSelect>
              </label>
              {group === "adulto" && <label className="block text-xs font-black text-hpsr-muted">Modelo adulto
                <StyledSelect value={adultVariant} onChange={(e) => setAdultVariant(e.target.value as AdultCardVariant)} className={`${inputClass} mt-1`}><option value="masculino">Masculino</option><option value="feminino">Feminino</option></StyledSelect>
              </label>}
              {group === "crianca" && <label className="block text-xs font-black text-hpsr-muted">Responsável
                <input value={guardians} onChange={(e) => setGuardians(e.target.value)} className={`${inputClass} mt-1`} placeholder="Digite o nome do responsável" />
                <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-hpsr-muted">Quando houver responsável autorizado no prontuário, o sistema preenche automaticamente. O nome pode ser ajustado ou digitado manualmente para esta caderneta.</span>
              </label>}
              <label className="block text-xs font-black text-hpsr-muted">Vacina
                <input list="vaccines" value={vaccine} onChange={(e) => setVaccine(e.target.value)} className={`${inputClass} mt-1`} placeholder="Digite ou selecione" />
                <datalist id="vaccines">{commonVaccines.map((item) => <option key={item} value={item}/>)}</datalist>
              </label>
              <label className="block text-xs font-black text-hpsr-muted">Dose
                <StyledSelect value={dose} onChange={(e) => setDose(e.target.value)} className={`${inputClass} mt-1`}>{doseOptions.map((item) => <option key={item}>{item}</option>)}</StyledSelect>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-black text-hpsr-muted">Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1`} /></label>
                <label className="block text-xs font-black text-hpsr-muted">Lote<input value={lot} onChange={(e) => setLot(e.target.value)} className={`${inputClass} mt-1`} placeholder="Opcional" /></label>
              </div>
              <label className="block text-xs font-black text-hpsr-muted">Médico responsável
                <StyledSelect value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className={`${inputClass} mt-1`}>
                  {availableDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · CRM {doctor.crm}</option>)}
                </StyledSelect>
              </label>
              <label className="block text-xs font-black text-hpsr-muted">Observações<textarea value={observation} onChange={(e) => setObservation(e.target.value)} className={`${inputClass} mt-1 min-h-[76px] py-2`} /></label>
              <div className="rounded-[14px] border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-900"><ShieldCheck size={15} className="mb-1"/>O carimbo é gerado automaticamente com logo HP, assinatura, nome e CRM de <strong>{selectedDoctor?.name || "médico selecionado"}</strong>.</div>
              <button type="button" onClick={() => void saveApplication()} disabled={saving || !selectedPatient} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Syringe size={16}/>}Registrar e aplicar na caderneta</button>
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-3">
          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-soft print:border-0 print:p-0 print:shadow-none">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div><h2 className="font-black text-hpsr-text">Caderneta gerada</h2><p className="text-xs font-semibold text-hpsr-muted">O histórico é a fonte de verdade; a caderneta é montada automaticamente.</p></div>
              <div className="flex items-center gap-2">
                {pageCount > 1 && <span className="text-xs font-black text-hpsr-muted">Página {page + 1}/{pageCount}</span>}
                <button onClick={() => void loadHistory()} className="rounded-[12px] border border-hpsr-border bg-white p-2 text-hpsr-wine"><RefreshCw size={16}/></button>
                <button onClick={exportCard} disabled={!selectedPatient} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-3 py-2 text-xs font-black text-white disabled:opacity-50"><Download size={15}/>Baixar PNG</button>
              </div>
            </div>
            {selectedPatient ? <CardPreview group={group} adultVariant={adultVariant} applications={groupHistory} patientName={selectedPatient.name} passport={selectedPatient.passport} birthDate={birthDate} guardians={guardians} page={page} /> : <div className="grid min-h-[420px] place-items-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fffaf4] text-sm font-bold text-hpsr-muted">Selecione um paciente para gerar a caderneta.</div>}
            {pageCount > 1 && <div className="mt-3 flex justify-center gap-2 print:hidden"><button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Anterior</button><button disabled={page>=pageCount-1} onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Próxima</button></div>}
          </section>

          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-soft print:hidden">
            <h2 className="font-black text-hpsr-text">Histórico de vacinação</h2>
            <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {loading ? <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-hpsr-wine"/></div> : history.length ? history.slice().reverse().map((item) => {
                const canDelete = !item.createdBy || item.createdBy === profile.id || profile.accessLevel === "Total";
                return <article key={item.id} className="flex flex-col gap-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-hpsr-text">{item.vaccine} · {item.dose}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">{formatDate(item.date)}{item.lot ? ` · Lote ${item.lot}` : ""} · {item.doctorName} · CRM {item.doctorCrm}</p></div>{canDelete && <button onClick={() => void removeApplication(item)} className="inline-flex items-center justify-center gap-1 rounded-[11px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><Trash2 size={14}/>Excluir</button>}</article>;
              }) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhuma vacina registrada para este paciente.</p>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
