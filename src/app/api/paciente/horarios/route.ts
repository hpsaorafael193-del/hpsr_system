import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import {
  CLINICAL_BOOKING_CUTOFF_MS,
  clinicalDateKey,
  normalizeClinicalSpecialty,
} from "@/lib/clinical-scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OCCURRENCES = 40;
const MAX_SLOTS = 250;
const MAX_SERIES = 80;
const OPEN_STATUSES = ["Planejada", "Aguardando abertura", "Horários disponíveis", "Pendente", "Ativa", "Ativo"];

type OccurrenceRow = { id: string; plan_id?: string | null; doctor_id?: string | null; doctor_name?: string | null; specialty: string; planned_date: string; status: string; patient_name: string };
type SlotRow = { id: string; series_id?: string | null; doctor_id: string; doctor_name: string; specialty: string; starts_at: string; ends_at: string; status: string };
type SeriesIdentityRow = { id: string; doctor_id: string; doctor_name: string; specialty: string };
type DoctorProfileRow = { id: string; name?: string | null; specialty?: string | null; role?: string | null };

function normalizeDoctorName(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function occurrenceKey(date: string, doctorId: unknown, specialty: unknown) {
  return [date, String(doctorId || ""), normalizeClinicalSpecialty(specialty)].join("::");
}

function occurrenceNameKey(date: string, doctorName: unknown, specialty: unknown) {
  return [date, normalizeDoctorName(doctorName), normalizeClinicalSpecialty(specialty)].join("::");
}

function specialtyCompatible(left: unknown, right: unknown) {
  const leftKey = normalizeClinicalSpecialty(left);
  const rightKey = normalizeClinicalSpecialty(right);
  if (!leftKey || !rightKey) return true;
  return leftKey === rightKey || leftKey.includes(rightKey) || rightKey.includes(leftKey);
}

function doctorNamesMatch(...values: unknown[]) {
  const names = values.map(normalizeDoctorName).filter(Boolean);
  return new Set(names).size <= 1 && names.length > 0;
}

async function loadAvailableSlots(supabase: any, cutoff: Date, lastDate: string) {
  // A busca é limitada pela janela de datas e pelo status. Não restringimos previamente
  // por doctor_id porque registros legados podem ter sido criados com outro identificador
  // para o mesmo profissional. O vínculo seguro é validado depois pelo plano/ocorrência.
  const { data, error } = await supabase
    .from("clinical_appointment_slots")
    .select("id,series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status")
    .eq("status", "Disponível")
    .gt("starts_at", cutoff.toISOString())
    .lte("starts_at", `${lastDate}T23:59:59-03:00`)
    .order("starts_at", { ascending: true })
    .limit(MAX_SLOTS);
  if (error) throw error;
  return (data || []) as SlotRow[];
}

async function projectLegacySlots(supabase: any, occurrences: OccurrenceRow[], cutoff: Date) {
  const firstDate = String(occurrences[0]?.planned_date || clinicalDateKey(cutoff));
  const lastDate = String(occurrences.at(-1)?.planned_date || firstDate);
  const { data: series, error } = await supabase
    .from("clinical_availability_series")
    .select("id,doctor_id,doctor_name,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,daily_limit,status")
    .in("status", ["Ativa", "Ativo"])
    .lte("start_date", lastDate)
    .gte("end_date", firstDate)
    .limit(MAX_SERIES);
  if (error) throw error;

  const rows: Array<Record<string, unknown>> = [];
  for (const occurrence of occurrences) {
    for (const item of series || []) {
      const sameDoctorId = Boolean(occurrence.doctor_id) && String(item.doctor_id) === String(occurrence.doctor_id);
      const sameDoctorName = Boolean(occurrence.doctor_name)
        && normalizeDoctorName(item.doctor_name) === normalizeDoctorName(occurrence.doctor_name);
      if (!sameDoctorId && !sameDoctorName) continue;
      if (normalizeClinicalSpecialty(item.specialty) !== normalizeClinicalSpecialty(occurrence.specialty)) continue;
      if (occurrence.planned_date < item.start_date || occurrence.planned_date > item.end_date) continue;
      const duration = Math.max(1, Number(item.slot_duration_minutes) || 60);
      const limit = Math.min(5, Math.max(1, Number(item.daily_limit) || 5));
      const [startHour, startMinute] = String(item.start_time).slice(0, 5).split(":").map(Number);
      const [endHour, endMinute] = String(item.end_time).slice(0, 5).split(":").map(Number);
      let minute = startHour * 60 + startMinute;
      const finalMinute = endHour * 60 + endMinute;
      for (let index = 0; index < limit && minute + duration <= finalMinute; index += 1) {
        const hour = String(Math.floor(minute / 60)).padStart(2, "0");
        const mins = String(minute % 60).padStart(2, "0");
        const startsAt = new Date(`${occurrence.planned_date}T${hour}:${mins}:00-03:00`);
        const endsAt = new Date(startsAt.getTime() + duration * 60000);
        if (startsAt > cutoff) rows.push({
          series_id: item.id,
          doctor_id: item.doctor_id,
          doctor_name: item.doctor_name,
          specialty: item.specialty,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "Disponível",
        });
        minute += duration;
      }
    }
  }
  if (rows.length) {
    const { error: upsertError } = await supabase.from("clinical_appointment_slots").upsert(rows, { onConflict: "doctor_id,starts_at", ignoreDuplicates: true });
    if (upsertError) throw upsertError;
  }
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });

    const now = new Date();
    const cutoff = new Date(now.getTime() + CLINICAL_BOOKING_CUTOFF_MS);
    const cutoffDate = clinicalDateKey(cutoff);
    const passport = normalizePassport(resolvedPassport);

    const { data: occurrenceData, error: occurrenceError } = await valid.supabase
      .from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,specialty,planned_date,status,patient_name")
      .ilike("patient_passport", passport)
      .gte("planned_date", cutoffDate)
      .in("status", OPEN_STATUSES)
      .order("planned_date", { ascending: true })
      .limit(MAX_OCCURRENCES);
    if (occurrenceError) throw occurrenceError;

    const occurrences = (occurrenceData || []) as OccurrenceRow[];
    if (!occurrences.length) return NextResponse.json({ ok: true, slots: [], patientName: "", window: { cutoffAt: cutoff.toISOString(), eligible: false } });

    const missingDoctorPlanIds = [...new Set(occurrences.filter((item) => !item.doctor_id && item.plan_id).map((item) => String(item.plan_id)))];
    if (missingDoctorPlanIds.length) {
      const { data: plans, error: planError } = await valid.supabase.from("clinical_followup_plans").select("id,doctor_id,doctor_name,specialty").in("id", missingDoctorPlanIds).limit(MAX_OCCURRENCES);
      if (planError) throw planError;
      const planMap = new Map((plans || []).map((plan: any) => [String(plan.id), plan]));
      for (const occurrence of occurrences) {
        const plan = occurrence.plan_id ? planMap.get(String(occurrence.plan_id)) : null;
        if (!occurrence.doctor_id && plan?.doctor_id) occurrence.doctor_id = String(plan.doctor_id);
        if (plan?.doctor_name) occurrence.doctor_name = String(plan.doctor_name);
        if (!occurrence.specialty && plan?.specialty) occurrence.specialty = String(plan.specialty);
      }
    }

    const allPlanIds = [...new Set(occurrences.map((item) => String(item.plan_id || "")).filter(Boolean))];
    if (allPlanIds.length) {
      const { data: planRows, error: planRowsError } = await valid.supabase
        .from("clinical_followup_plans")
        .select("id,doctor_id,doctor_name,specialty")
        .in("id", allPlanIds)
        .limit(MAX_OCCURRENCES);
      if (planRowsError) throw planRowsError;
      const planMap = new Map((planRows || []).map((plan: any) => [String(plan.id), plan]));
      for (const occurrence of occurrences) {
        const plan = occurrence.plan_id ? planMap.get(String(occurrence.plan_id)) : null;
        if (!occurrence.doctor_id && plan?.doctor_id) occurrence.doctor_id = String(plan.doctor_id);
        if (!occurrence.doctor_name && plan?.doctor_name) occurrence.doctor_name = String(plan.doctor_name);
        if (!occurrence.specialty && plan?.specialty) occurrence.specialty = String(plan.specialty);
      }
    }

    const lastOccurrenceDate = String(occurrences.at(-1)?.planned_date || cutoffDate);
    let availableSlots = await loadAvailableSlots(valid.supabase, cutoff, lastOccurrenceDate);

    const seriesIds = [...new Set(availableSlots.map((slot) => String(slot.series_id || "")).filter(Boolean))];
    const seriesMap = new Map<string, SeriesIdentityRow>();
    if (seriesIds.length) {
      const { data: seriesRows, error: seriesIdentityError } = await valid.supabase
        .from("clinical_availability_series")
        .select("id,doctor_id,doctor_name,specialty")
        .in("id", seriesIds)
        .limit(MAX_SERIES);
      if (seriesIdentityError) throw seriesIdentityError;
      for (const row of (seriesRows || []) as SeriesIdentityRow[]) seriesMap.set(String(row.id), row);
    }

    const doctorIds = [...new Set([
      ...occurrences.map((item) => String(item.doctor_id || "")),
      ...availableSlots.map((item) => String(item.doctor_id || "")),
      ...[...seriesMap.values()].map((item) => String(item.doctor_id || "")),
    ].filter(Boolean))];
    const profileMap = new Map<string, DoctorProfileRow>();
    if (doctorIds.length) {
      const { data: profileRows, error: profileError } = await valid.supabase
        .from("profiles")
        .select("id,name,specialty,role")
        .in("id", doctorIds)
        .limit(MAX_SLOTS);
      if (profileError) throw profileError;
      for (const row of (profileRows || []) as DoctorProfileRow[]) profileMap.set(String(row.id), row);
    }

    const matchSlot = (slot: SlotRow) => {
      const slotDate = clinicalDateKey(new Date(slot.starts_at));
      const series = slot.series_id ? seriesMap.get(String(slot.series_id)) : null;
      const slotProfile = profileMap.get(String(slot.doctor_id || ""));
      const seriesProfile = series ? profileMap.get(String(series.doctor_id || "")) : null;

      return occurrences.find((occurrence) => {
        // A data e o médico definem a elegibilidade da vaga. A especialidade exibida
        // vem do acompanhamento, evitando que variações históricas de nomenclatura
        // descartem horários válidos publicados pelo próprio profissional.
        if (String(occurrence.planned_date) !== slotDate) return false;
        const occurrenceProfile = profileMap.get(String(occurrence.doctor_id || ""));
        const sameDoctorId = Boolean(occurrence.doctor_id) && [slot.doctor_id, series?.doctor_id]
          .filter(Boolean)
          .some((doctorId) => String(doctorId) === String(occurrence.doctor_id));
        const occurrenceNames = [occurrence.doctor_name, occurrenceProfile?.name].filter(Boolean);
        const slotNames = [slot.doctor_name, series?.doctor_name, slotProfile?.name, seriesProfile?.name].filter(Boolean);
        const sameDoctorName = occurrenceNames.some((left) => slotNames.some((right) => normalizeDoctorName(left) === normalizeDoctorName(right)));
        return sameDoctorId || sameDoctorName;
      });
    };

    let matchingSlots = availableSlots.flatMap((slot) => {
      const occurrence = matchSlot(slot);
      return occurrence ? [{
        ...slot,
        occurrenceId: occurrence.id,
        plannedDate: occurrence.planned_date,
        specialty: occurrence.specialty || slot.specialty,
        doctor_name: occurrence.doctor_name || slot.doctor_name,
      }] : [];
    });

    if (!matchingSlots.length) {
      await projectLegacySlots(valid.supabase, occurrences, cutoff);
      availableSlots = await loadAvailableSlots(valid.supabase, cutoff, lastOccurrenceDate);
      matchingSlots = availableSlots.flatMap((slot) => {
        const occurrence = matchSlot(slot);
        return occurrence ? [{
        ...slot,
        occurrenceId: occurrence.id,
        plannedDate: occurrence.planned_date,
        specialty: occurrence.specialty || slot.specialty,
        doctor_name: occurrence.doctor_name || slot.doctor_name,
      }] : [];
      });
    }

    const occurrenceDates = new Set(occurrences.map((item) => String(item.planned_date)));
    const slotsOnPlannedDates = availableSlots.filter((slot) => occurrenceDates.has(clinicalDateKey(new Date(slot.starts_at))));

    const firstSlot = matchingSlots[0];
    const nextOccurrenceId = firstSlot?.occurrenceId || null;
    const slots = nextOccurrenceId ? matchingSlots.filter((slot) => slot.occurrenceId === nextOccurrenceId) : [];

    return NextResponse.json({
      ok: true,
      slots,
      patientName: String(occurrences[0]?.patient_name || ""),
      window: { cutoffAt: cutoff.toISOString(), nextAvailableDate: firstSlot ? clinicalDateKey(new Date(firstSlot.starts_at)) : null, eligible: slots.length > 0 },
      diagnostics: slots.length ? undefined : {
        occurrencesFound: occurrences.length,
        availableSlotsFound: availableSlots.length,
        slotsOnPlannedDates: slotsOnPlannedDates.length,
        reason: availableSlots.length
          ? slotsOnPlannedDates.length
            ? "Existem horários nas datas planejadas, mas eles pertencem a outro médico. Verifique se o acompanhamento e a publicação foram criados pela mesma conta profissional."
            : "Existem horários publicados, porém nenhum está nas datas planejadas deste acompanhamento."
          : "Não existem horários disponíveis fora da janela de 24 horas para as datas planejadas.",
      },
    });
  } catch (error) {
    console.error("[patient-portal] available slots", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os horários disponíveis." }, { status: 500 });
  }
}
