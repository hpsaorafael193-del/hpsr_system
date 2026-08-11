"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Minus, Plus, RefreshCw, ShieldCheck, Syringe, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";
import { brazilDate, brazilIso } from "@/lib/brazil-datetime";
import {
  assignApplicationsToSlots,
  commonVaccines,
  doseOptions,
  generateVaccinationLot,
  getVaccinationCardDefinition,
  suggestVaccinationGroup,
  type AdultCardVariant,
  type VaccinationApplication,
  type VaccinationGroup,
  type VaccinationIdentityField,
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
    doctorName: String(doctor.name || payload.doctorName || "Médico responsável"),
    doctorCrm: String(doctor.crm || payload.doctorCrm || "—"),
    signatureImage: doctor.signatureImage || null,
    createdAt: String(row.created_at || ""),
    createdBy: String(row.created_by || ""),
  };
}

type VaccinationCardRenderArgs = {
  canvas: HTMLCanvasElement;
  group: VaccinationGroup;
  adultVariant: AdultCardVariant;
  applications: VaccinationApplication[];
  patientName: string;
  passport: string;
  birthDate: string;
  guardians: string;
  page: number;
};

const canvasImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadCanvasImage(src: string) {
  const cached = canvasImageCache.get(src);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      canvasImageCache.delete(src);
      reject(new Error(`Não foi possível carregar a imagem: ${src}`));
    };
    image.src = src;
  });
  canvasImageCache.set(src, pending);
  return pending;
}

async function renderVaccinationCard({
  canvas,
  group,
  adultVariant,
  applications,
  patientName,
  passport,
  birthDate,
  guardians,
  page,
}: VaccinationCardRenderArgs) {
  const definition = getVaccinationCardDefinition(group, adultVariant);
  const pageApps = applications.slice(page * definition.slots.length, (page + 1) * definition.slots.length);
  const assigned = assignApplicationsToSlots(pageApps, definition);
  const template = await loadCanvasImage(definition.template);

  canvas.width = definition.width;
  canvas.height = definition.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  const brown = "#5a260f";
  const blue = "#1d58a7";
  const px = (percent: number, axis: "x" | "y") => percent / 100 * (axis === "x" ? canvas.width : canvas.height);
  const write = (value: string, x: number, y: number, size: number, color = brown, weight = "700", maxWidth?: number) => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(value || "", x, y, maxWidth);
  };
  const writeFitted = (value: string, x: number, y: number, maxWidth: number, preferredSize: number, minimumSize: number, color = brown, weight = "700") => {
    const content = value || "";
    if (!content) return;
    let size = preferredSize;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    while (size > minimumSize) {
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
      if (ctx.measureText(content).width <= maxWidth) break;
      size -= 1;
    }
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    let rendered = content;
    if (ctx.measureText(rendered).width > maxWidth) {
      while (rendered.length > 1 && ctx.measureText(`${rendered}…`).width > maxWidth) rendered = rendered.slice(0, -1);
      rendered = `${rendered}…`;
    }
    ctx.fillText(rendered, x, y);
  };

  const writeIdentityField = (value: string, field: VaccinationIdentityField) => {
    const content = value || "";
    if (!content) return;
    const startX = px(field.startX, "x");
    const endX = px(field.endX, "x");
    const availableWidth = Math.max(1, endX - startX);
    const color = field.color || brown;
    const weight = field.weight || "700";
    const minimum = field.minFontSize || Math.max(9, Math.round(field.fontSize * .65));
    let size = field.fontSize;

    ctx.textAlign = "left";
    ctx.fillStyle = color;
    while (size > minimum) {
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
      if (ctx.measureText(content).width <= availableWidth) break;
      size -= 1;
    }
    ctx.font = `${weight} ${size}px Arial, sans-serif`;

    if (field.mode === "line" && typeof field.lineY === "number") {
      ctx.textBaseline = "alphabetic";
      const baselineY = px(field.lineY, "y") - Math.max(2, size * .12);
      ctx.fillText(content, startX, baselineY);
      return;
    }

    const top = px(field.top || 0, "y");
    const bottom = px(field.bottom || field.top || 0, "y");
    ctx.textBaseline = "middle";
    ctx.fillText(content, startX, top + Math.max(1, bottom - top) / 2);
  };

  writeIdentityField(patientName, definition.identity.name);
  writeIdentityField(passport, definition.identity.passport);
  if (definition.identity.birthDate) writeIdentityField(formatDate(birthDate), definition.identity.birthDate);
  if (definition.identity.guardians) writeIdentityField(guardians, definition.identity.guardians);

  const logo = await loadCanvasImage("/logo-hpsr.png").catch(() => null);
  for (const slot of definition.slots) {
    const app = assigned.get(slot.id);
    if (!app) continue;
    const x = px(slot.left, "x");
    const y = px(slot.top, "y");
    const w = px(slot.width, "x");
    const h = px(slot.height, "y");

    if (group === "adulto" || group === "idoso") {
      const vx = x + w * .21;
      write(app.vaccine, vx, y + h * .04, Math.max(11, w * .035), brown, "800", w * .74);
      write(app.dose, vx, y + h * .18, Math.max(11, w * .035), brown, "700", w * .74);
      write(formatDate(app.date), vx, y + h * .32, Math.max(11, w * .035), brown, "700", w * .74);
      write(app.lot || "—", vx, y + h * .46, Math.max(11, w * .035), brown, "700", w * .74);
    } else if (group === "crianca" && slot.contentLayout) {
      const layout = slot.contentLayout;
      const textX = x + w * (layout.left / 100);
      const textWidth = w * (layout.width / 100);
      const startY = y + h * (layout.top / 100);
      const gap = h * (layout.lineGap / 100);
      const preferred = Math.max(10, Math.min(14, w * .057));
      const secondary = Math.max(9, preferred - 1);
      writeFitted(app.vaccine, textX, startY, textWidth, preferred, 8, brown, "800");
      writeFitted(app.dose, textX, startY + gap, textWidth, secondary, 8, brown, "700");
      writeFitted(formatDate(app.date), textX, startY + gap * 2, textWidth, secondary, 8, brown, "700");
      writeFitted(`Lote ${app.lot || "—"}`, textX, startY + gap * 3, textWidth, Math.max(8, secondary - 1), 7, brown, "700");
    } else {
      write(app.vaccine, x + w * .05, y + h * .05, Math.max(10, w * .04), brown, "800", w * .55);
      write(app.dose, x + w * .05, y + h * .20, Math.max(9, w * .036), brown, "700", w * .55);
      write(formatDate(app.date), x + w * .05, y + h * .34, Math.max(9, w * .036), brown, "700", w * .55);
      if (app.lot) write(`Lote ${app.lot}`, x + w * .05, y + h * .48, Math.max(8, w * .032), brown, "700", w * .55);
    }

    const configuredStamp = group === "crianca" ? slot.stampLayout : undefined;
    const radius = configuredStamp
      ? Math.min(w, h) * (configuredStamp.radius / 100)
      : Math.min(w, h) * ((slot.stampScale || 1) < 1 ? .195 : .218);
    const cx = configuredStamp ? x + w * (configuredStamp.centerX / 100) : x + w - radius * 1.25;
    const cy = configuredStamp ? y + h * (configuredStamp.centerY / 100) : y + h - radius * 1.25;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.strokeStyle = blue;
    ctx.fillStyle = blue;
    ctx.globalAlpha = .86;
    ctx.lineWidth = Math.max(2, radius * .04);
    ctx.setLineDash([radius * .12, radius * .06]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (logo) {
      ctx.globalAlpha = .72;
      ctx.drawImage(logo, -radius * .22, -radius * .44, radius * .44, radius * .44);
    }
    ctx.globalAlpha = .88;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(group === "crianca" ? 6 : 7, radius * (group === "crianca" ? .17 : .15))}px Arial, sans-serif`;
    ctx.fillText(app.doctorName.slice(0, 28), 0, radius * .08, radius * 1.55);
    ctx.font = `800 ${Math.max(group === "crianca" ? 6 : 7, radius * (group === "crianca" ? .16 : .14))}px Arial, sans-serif`;
    ctx.fillText(`CRM ${app.doctorCrm}`, 0, radius * .67, radius * 1.5);
    if (app.signatureImage) {
      const signature = await loadCanvasImage(app.signatureImage).catch(() => null);
      if (signature) {
        ctx.globalAlpha = .78;
        ctx.drawImage(signature, -radius * .55, radius * .22, radius * 1.1, radius * .30);
      }
    }
    ctx.restore();
  }
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
  zoom,
}: {
  group: VaccinationGroup;
  adultVariant: AdultCardVariant;
  applications: VaccinationApplication[];
  patientName: string;
  passport: string;
  birthDate: string;
  guardians: string;
  page: number;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersionRef = useRef(0);
  const def = getVaccinationCardDefinition(group, adultVariant);
  const basePreviewHeight = group === "crianca" ? 330 : 290;
  const previewHeight = Math.round(basePreviewHeight * (zoom / 100));
  const previewWidth = Math.round(previewHeight * (def.width / def.height));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderVersion = ++renderVersionRef.current;
    const offscreen = document.createElement("canvas");
    void renderVaccinationCard({ canvas: offscreen, group, adultVariant, applications, patientName, passport, birthDate, guardians, page })
      .then(() => {
        if (renderVersionRef.current !== renderVersion) return;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0);
      })
      .catch(() => {
        // A falha de prévia não deve quebrar a página; o export mantém tratamento próprio.
      });
  }, [group, adultVariant, applications, patientName, passport, birthDate, guardians, page]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Pré-visualização da caderneta de vacinação"
      className="shrink-0 rounded-[16px] border border-hpsr-border bg-white shadow-soft"
      style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
    />
  );
}

export default function VaccinationPage() {
  const { patients, loading: patientsLoading, selectedPatient, selectedPassport, selectPatient, upsertPatient } = usePatientSelection();
  const { profile } = useCurrentUserProfile();
  const [patientName, setPatientName] = useState("");
  const [patientPassport, setPatientPassport] = useState("");
  const [group, setGroup] = useState<VaccinationGroup>("adulto");
  const [adultVariant, setAdultVariant] = useState<AdultCardVariant>("masculino");
  const [vaccine, setVaccine] = useState("");
  const [dose, setDose] = useState("1ª dose");
  const [date, setDate] = useState(() => brazilDate());
  const [lot, setLot] = useState(() => generateVaccinationLot());
  const [history, setHistory] = useState<VaccinationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [guardians, setGuardians] = useState("");
  const [page, setPage] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    if (!selectedPatient) return;
    setPatientName(selectedPatient.name);
    setPatientPassport(selectedPatient.passport);
    setGroup(suggestVaccinationGroup(selectedPatient.age));
  }, [selectedPatient?.passport]);

  useEffect(() => {
    setPreviewZoom(100);
  }, [group]);

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

  function handlePatientEntry(value: string) {
    const exact = patients.find((patient) => `${patient.name} · ${patient.passport}` === value);
    if (exact) {
      setPatientName(exact.name);
      setPatientPassport(exact.passport);
      selectPatient(exact.passport);
      return;
    }
    setPatientName(value);
    if (selectedPatient && value !== selectedPatient.name) {
      selectPatient(null);
      setPatientPassport("");
      setBirthDate("");
      setGuardians("");
      setHistory([]);
    }
  }

  function handlePassportEntry(value: string) {
    const normalized = value.toUpperCase();
    setPatientPassport(normalized);
    const exact = patients.find((patient) => patient.passport === normalized);
    if (exact) {
      setPatientName(exact.name);
      selectPatient(exact.passport);
      return;
    }
    if (selectedPatient && normalized !== selectedPatient.passport) {
      selectPatient(null);
      setBirthDate("");
      setGuardians("");
      setHistory([]);
    }
  }

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
    } else {
      const latestManualGuardian = [...(recordsResult.data || [])].reverse().map((row: any) => String(row?.payload?.patient?.guardian || row?.payload?.guardianName || "").trim()).find(Boolean) || "";
      setGuardians(latestManualGuardian);
    }
    setLoading(false);
  }

  useEffect(() => { void loadHistory(); }, [selectedPassport]);

  const groupHistory = useMemo(() => history.filter((item) => item.group === group), [history, group]);
  const def = getVaccinationCardDefinition(group, adultVariant);
  const pageCount = Math.max(1, Math.ceil(groupHistory.length / def.slots.length));
  useEffect(() => setPage(Math.max(0, pageCount - 1)), [group, selectedPassport, pageCount]);

  async function saveApplication() {
    const normalizedName = patientName.trim();
    const normalizedPassport = patientPassport.trim().toUpperCase();
    if (!normalizedName || !normalizedPassport) return void hpsrAlert("Informe nome e passaporte do paciente.", "Paciente obrigatório");
    if (group === "crianca" && !birthDate) return void hpsrAlert("Informe a data de nascimento da criança.", "Data de nascimento obrigatória");
    if (!vaccine.trim() || !dose || !date) return void hpsrAlert("Informe vacina, dose e data da aplicação.", "Preenchimento incompleto");
    if (!selectedDoctor) return void hpsrAlert("Selecione o médico responsável pela aplicação.", "Médico obrigatório");
    if (!selectedDoctor.crm || selectedDoctor.crm === "—") return void hpsrAlert("O médico responsável precisa ter CRM cadastrado para gerar o carimbo.", "CRM obrigatório");
    if (!selectedDoctor.signatureImage) return void hpsrAlert("O médico responsável precisa ter uma assinatura cadastrada para compor o carimbo.", "Assinatura obrigatória");
    const duplicate = history.some((item) => item.vaccine.trim().toLowerCase() === vaccine.trim().toLowerCase() && item.dose === dose && item.date === date);
    if (duplicate) return void hpsrAlert("Já existe uma aplicação desta vacina, nesta dose e nesta data para o paciente.", "Aplicação duplicada");

    const resolvedLot = lot.trim() || generateVaccinationLot();
    const client = createClient();
    if (!client) return;
    setSaving(true);

    const registrySaved = await upsertPatient({
      name: normalizedName,
      passport: normalizedPassport,
      age: selectedPatient?.passport === normalizedPassport ? selectedPatient.age : "",
      bloodType: selectedPatient?.passport === normalizedPassport ? selectedPatient.bloodType : "",
      cityPhone: selectedPatient?.passport === normalizedPassport ? selectedPatient.cityPhone : "",
      email: selectedPatient?.passport === normalizedPassport ? selectedPatient.email : "",
    });
    if (!registrySaved) {
      setSaving(false);
      return void hpsrAlert("Não foi possível criar ou atualizar o cadastro mínimo do paciente no prontuário.", "Paciente não salvo");
    }
    if (birthDate) {
      const { error: birthDateError } = await client.from("patient_registry").update({ birth_date: birthDate }).eq("passport", normalizedPassport);
      if (birthDateError) {
        setSaving(false);
        return void hpsrAlert(birthDateError.message, "Não foi possível salvar a data de nascimento");
      }
    }

    const id = crypto.randomUUID();
    const now = brazilIso();
    const payload = {
      title: `Vacinação · ${vaccine.trim()} · ${dose}`,
      summary: `${vaccine.trim()} · ${dose} · ${formatDate(date)}`,
      patient: { name: normalizedName, passport: normalizedPassport, birthDate, guardian: group === "crianca" ? guardians.trim() : undefined },
      patientName: normalizedName,
      patientPassport: normalizedPassport,
      guardianName: group === "crianca" ? guardians.trim() : undefined,
      vaccine: { name: vaccine.trim(), dose, date, lot: resolvedLot, group, adultVariant: group === "adulto" ? adultVariant : undefined },
      doctor: { name: selectedDoctor.name, crm: selectedDoctor.crm, signatureImage: selectedDoctor.signatureImage },
      doctorName: selectedDoctor.name,
      doctorCrm: selectedDoctor.crm,
      cardModel: group === "adulto" ? `adulto-${adultVariant}` : group,
      releasedToPatient: true,
    };
    const { error } = await client.from("clinical_records").insert({
      id,
      patient_passport: normalizedPassport,
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
    setVaccine(""); setLot(generateVaccinationLot());
    selectPatient(normalizedPassport);
    await loadHistory(normalizedPassport);
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
    const normalizedName = patientName.trim();
    const normalizedPassport = patientPassport.trim().toUpperCase();
    if (!normalizedName || !normalizedPassport) return void hpsrAlert("Informe nome e passaporte do paciente antes de gerar a caderneta.", "Paciente obrigatório");
    if (group === "crianca" && !birthDate) return void hpsrAlert("Informe a data de nascimento da criança antes de gerar a caderneta.", "Data de nascimento obrigatória");
    try {
      const canvas = document.createElement("canvas");
      await renderVaccinationCard({
        canvas,
        group,
        adultVariant,
        applications: groupHistory,
        patientName: normalizedName,
        passport: normalizedPassport,
        birthDate,
        guardians,
        page,
      });
      const anchor = document.createElement("a");
      const safeName = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      anchor.download = `caderneta-vacinacao-${safeName || normalizedPassport}-p${page + 1}.png`;
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
                <input list="vaccination-patients" value={patientName} onChange={(e) => handlePatientEntry(e.target.value)} className={`${inputClass} mt-1`} placeholder={patientsLoading ? "Carregando pacientes..." : "Digite ou selecione um paciente"} />
                <datalist id="vaccination-patients">{patients.map((p) => <option key={p.passport} value={`${p.name} · ${p.passport}`}/>)}</datalist>
                <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-hpsr-muted">Selecione alguém do prontuário ou digite um nome novo.</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block text-xs font-black text-hpsr-muted">Passaporte
                  <input value={patientPassport} onChange={(e) => handlePassportEntry(e.target.value)} className={`${inputClass} mt-1`} placeholder="Digite o passaporte" />
                </label>
                {def.identity.birthDate && <label className="block text-xs font-black text-hpsr-muted">Data de nascimento
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${inputClass} mt-1`} />
                </label>}
              </div>
              <p className="rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-[10px] font-semibold leading-relaxed text-hpsr-muted">Se o passaporte ainda não existir no prontuário, o cadastro mínimo do paciente será criado automaticamente quando a vacina for registrada.</p>
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
                <label className="block text-xs font-black text-hpsr-muted">Lote
                  <div className="mt-1 flex gap-2">
                    <input value={lot} readOnly className={`${inputClass} flex-1 bg-[#faf5ef] text-hpsr-text/90`} placeholder="Gerado automaticamente" />
                    <button type="button" onClick={() => setLot(generateVaccinationLot())} className="inline-flex min-h-[44px] items-center justify-center rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 text-hpsr-wine transition hover:border-hpsr-wine/35 hover:bg-white" title="Gerar outro lote" aria-label="Gerar outro lote"><RefreshCw size={15} /></button>
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-hpsr-muted">O lote é criado automaticamente pelo sistema e pode ser regenerado se você quiser outro código.</span>
                </label>
              </div>
              <label className="block text-xs font-black text-hpsr-muted">Médico responsável
                <StyledSelect value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className={`${inputClass} mt-1`}>
                  {availableDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · CRM {doctor.crm}</option>)}
                </StyledSelect>
              </label>
              <div className="rounded-[14px] border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-900"><ShieldCheck size={15} className="mb-1"/>O carimbo é gerado automaticamente com logo HP, assinatura, nome e CRM de <strong>{selectedDoctor?.name || "médico selecionado"}</strong>.</div>
              <button type="button" onClick={() => void saveApplication()} disabled={saving || !patientName.trim() || !patientPassport.trim()} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Syringe size={16}/>}Registrar e aplicar na caderneta</button>
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-3">
          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-soft print:border-0 print:p-0 print:shadow-none">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div><h2 className="font-black text-hpsr-text">Caderneta gerada</h2><p className="text-xs font-semibold text-hpsr-muted">O histórico é a fonte de verdade; a caderneta é montada automaticamente.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                {pageCount > 1 && <span className="text-xs font-black text-hpsr-muted">Página {page + 1}/{pageCount}</span>}
                <div className="inline-flex items-center rounded-[12px] border border-hpsr-border bg-[#fffaf4] p-1" aria-label="Zoom da pré-visualização">
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.max(75, value - 8))} className="grid h-7 w-7 place-items-center rounded-[8px] text-hpsr-wine hover:bg-white" title="Diminuir prévia"><Minus size={14}/></button>
                  <button type="button" onClick={() => setPreviewZoom(100)} className="min-w-[48px] px-1 text-[11px] font-black text-hpsr-muted" title="Restaurar tamanho compacto">{previewZoom}%</button>
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.min(108, value + 8))} className="grid h-7 w-7 place-items-center rounded-[8px] text-hpsr-wine hover:bg-white" title="Aumentar prévia"><Plus size={14}/></button>
                </div>
                <button onClick={() => void loadHistory()} className="rounded-[12px] border border-hpsr-border bg-white p-2 text-hpsr-wine"><RefreshCw size={16}/></button>
                <button onClick={exportCard} disabled={!patientName.trim() || !patientPassport.trim()} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-3 py-2 text-xs font-black text-white disabled:opacity-50"><Download size={15}/>Baixar PNG</button>
              </div>
            </div>
            {patientName.trim() && patientPassport.trim() ? (
              <div className={`grid ${group === "crianca" ? "h-[370px]" : "h-[330px]"} place-items-center justify-items-center overflow-hidden rounded-[16px] border border-hpsr-border/70 bg-[#f8f5f1] p-3`}>
                <CardPreview group={group} adultVariant={adultVariant} applications={groupHistory} patientName={patientName.trim()} passport={patientPassport.trim().toUpperCase()} birthDate={birthDate} guardians={guardians} page={page} zoom={previewZoom} />
              </div>
            ) : <div className={`grid ${group === "crianca" ? "h-[370px]" : "h-[330px]"} place-items-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fffaf4] text-sm font-bold text-hpsr-muted`}>Informe nome e passaporte para gerar a caderneta.</div>}
            {pageCount > 1 && <div className="mt-3 flex justify-center gap-2 print:hidden"><button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Anterior</button><button disabled={page>=pageCount-1} onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Próxima</button></div>}
          </section>

          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-soft print:hidden">
            <h2 className="font-black text-hpsr-text">Histórico de vacinação</h2>
            <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
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
