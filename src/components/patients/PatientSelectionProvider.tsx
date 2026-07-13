"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export type SharedPatient = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  cityPhone?: string;
  email?: string;
};

type PatientSelectionContextValue = {
  patients: SharedPatient[];
  loading: boolean;
  selectedPatient: SharedPatient | null;
  selectedPassport: string;
  selectPatient: (patientOrPassport: SharedPatient | string | null) => void;
  upsertPatient: (patient: SharedPatient) => void;
  refreshPatients: () => Promise<void>;
};

const PatientSelectionContext = createContext<PatientSelectionContextValue | null>(null);
const SELECTED_PATIENT_KEY = "hpsr-selected-patient";
const PATIENT_CACHE_KEY = "hpsr-patients-cache";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePatient(input: Partial<SharedPatient>): SharedPatient | null {
  const passport = text(input.passport);
  if (!passport) return null;
  return {
    name: text(input.name) || `Paciente ${passport}`,
    passport,
    age: text(input.age),
    bloodType: text(input.bloodType),
    cityPhone: text(input.cityPhone),
    email: text(input.email),
  };
}

function mergePatient(current: SharedPatient | undefined, next: Partial<SharedPatient>): SharedPatient | null {
  const normalized = normalizePatient({ ...current, ...next });
  if (!normalized) return null;
  return {
    ...normalized,
    name: text(next.name) && !text(next.name).startsWith("Paciente ") ? text(next.name) : current?.name || normalized.name,
    age: text(next.age) && text(next.age) !== "—" ? text(next.age) : current?.age || "",
    bloodType: text(next.bloodType) && text(next.bloodType) !== "—" ? text(next.bloodType) : current?.bloodType || "",
    cityPhone: text(next.cityPhone) && text(next.cityPhone) !== "Não informado" ? text(next.cityPhone) : current?.cityPhone || "",
    email: text(next.email) || current?.email || "",
  };
}

export function PatientSelectionProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<SharedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassport, setSelectedPassport] = useState("");

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(PATIENT_CACHE_KEY) || "[]") as SharedPatient[];
      if (Array.isArray(cached)) setPatients(cached.map(normalizePatient).filter(Boolean) as SharedPatient[]);
      setSelectedPassport(localStorage.getItem(SELECTED_PATIENT_KEY) || "");
    } catch {
      // cache inválido é ignorado
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [recordsResult, appointmentsResult, portalResult] = await Promise.all([
      client.from("clinical_records").select("patient_passport,payload,created_at").order("created_at", { ascending: false }),
      client.from("appointments").select("passport,patient,payload,created_at").order("created_at", { ascending: false }),
      client.from("patient_portal_access").select("patient_passport,email,created_at").order("created_at", { ascending: false }),
    ]);

    const map = new Map<string, SharedPatient>();
    const add = (input: Partial<SharedPatient>) => {
      const passport = text(input.passport);
      if (!passport) return;
      const merged = mergePatient(map.get(passport), input);
      if (merged) map.set(passport, merged);
    };

    for (const row of portalResult.data || []) add({ passport: row.patient_passport, email: row.email });
    for (const row of appointmentsResult.data || []) {
      const payload = (row.payload || {}) as Record<string, any>;
      const patient = typeof payload.patient === "object" && payload.patient ? payload.patient : {};
      add({
        passport: row.passport,
        name: row.patient || patient.name || payload.patientName,
        age: patient.age || payload.age,
        bloodType: patient.bloodType || payload.bloodType,
        cityPhone: patient.cityPhone || payload.cityPhone,
      });
    }
    for (const row of recordsResult.data || []) {
      const payload = (row.payload || {}) as Record<string, any>;
      const patient = typeof payload.patient === "object" && payload.patient ? payload.patient : {};
      add({
        passport: row.patient_passport,
        name: patient.name || payload.patientName,
        age: patient.age || payload.age,
        bloodType: patient.bloodType || payload.bloodType,
        cityPhone: patient.cityPhone || payload.cityPhone,
      });
    }

    setPatients((current) => {
      for (const patient of current) {
        const merged = mergePatient(map.get(patient.passport), patient);
        if (merged) map.set(patient.passport, merged);
      }
      const next = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      localStorage.setItem(PATIENT_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshPatients();
    const client = createClient();
    if (!client) return;
    const channel = client
      .channel("shared-patient-selection")
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_records" }, () => void refreshPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => void refreshPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_portal_access" }, () => void refreshPatients())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [refreshPatients]);

  const upsertPatient = useCallback((patient: SharedPatient) => {
    const normalized = normalizePatient(patient);
    if (!normalized) return;
    setPatients((current) => {
      const found = current.find((item) => item.passport === normalized.passport);
      const merged = mergePatient(found, normalized) || normalized;
      const next = found
        ? current.map((item) => item.passport === normalized.passport ? merged : item)
        : [merged, ...current];
      const sorted = [...next].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      localStorage.setItem(PATIENT_CACHE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  }, []);

  const selectPatient = useCallback((patientOrPassport: SharedPatient | string | null) => {
    const passport = typeof patientOrPassport === "string" ? patientOrPassport : patientOrPassport?.passport || "";
    setSelectedPassport(passport);
    if (passport) localStorage.setItem(SELECTED_PATIENT_KEY, passport);
    else localStorage.removeItem(SELECTED_PATIENT_KEY);
    if (typeof patientOrPassport === "object" && patientOrPassport) upsertPatient(patientOrPassport);
  }, [upsertPatient]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.passport === selectedPassport) || null,
    [patients, selectedPassport],
  );

  return (
    <PatientSelectionContext.Provider value={{ patients, loading, selectedPatient, selectedPassport, selectPatient, upsertPatient, refreshPatients }}>
      {children}
    </PatientSelectionContext.Provider>
  );
}

export function usePatientSelection() {
  const value = useContext(PatientSelectionContext);
  if (!value) throw new Error("usePatientSelection deve ser usado dentro de PatientSelectionProvider");
  return value;
}
