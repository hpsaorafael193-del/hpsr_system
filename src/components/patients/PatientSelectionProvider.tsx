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
  upsertPatient: (patient: SharedPatient) => Promise<boolean>;
  refreshPatients: () => Promise<void>;
};

const PatientSelectionContext = createContext<PatientSelectionContextValue | null>(null);
const SELECTED_PATIENT_KEY = "hpsr-selected-patient";
const PATIENT_CACHE_KEY = "hpsr-patients-cache";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePassport(value: unknown) {
  return text(value).toUpperCase();
}

function normalizePatient(input: Partial<SharedPatient>): SharedPatient | null {
  const passport = normalizePassport(input.passport);
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

function writePatientCache(patients: SharedPatient[]) {
  try {
    localStorage.setItem(PATIENT_CACHE_KEY, JSON.stringify(patients));
  } catch {
    // Cache é apenas uma otimização. Falhas locais nunca bloqueiam o banco.
  }
}

export function PatientSelectionProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<SharedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassport, setSelectedPassport] = useState("");

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(PATIENT_CACHE_KEY) || "[]") as SharedPatient[];
      if (Array.isArray(cached)) {
        setPatients(cached.map(normalizePatient).filter(Boolean) as SharedPatient[]);
      }
      setSelectedPassport(normalizePassport(localStorage.getItem(SELECTED_PATIENT_KEY)));
    } catch {
      localStorage.removeItem(PATIENT_CACHE_KEY);
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await client
      .from("patient_registry")
      .select("passport,name,age,blood_type,city_phone,email,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      // Em falha de rede, o cache pode continuar visível como cópia temporária,
      // mas nunca é enviado ao Supabase nem tratado como fonte de verdade.
      console.error("[HPSR] Falha ao sincronizar pacientes:", error.message);
      setLoading(false);
      return;
    }

    const authoritative = (data || [])
      .map((row) => normalizePatient({
        passport: row.passport,
        name: row.name,
        age: row.age,
        bloodType: row.blood_type,
        cityPhone: row.city_phone,
        email: row.email,
      }))
      .filter(Boolean) as SharedPatient[];

    authoritative.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    // Um retorno vazio válido do Supabase também substitui o cache local.
    // Isso impede que pacientes excluídos reapareçam como dados fantasmas.
    setPatients(authoritative);
    writePatientCache(authoritative);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshPatients();
    const client = createClient();
    if (!client) return;
    const channel = client
      .channel("shared-patient-selection")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_registry" }, () => void refreshPatients())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [refreshPatients]);

  const upsertPatient = useCallback(async (patient: SharedPatient) => {
    const normalized = normalizePatient(patient);
    if (!normalized) return false;

    const client = createClient();
    if (!client) return false;

    const { error } = await client.from("patient_registry").upsert({
      passport: normalized.passport,
      name: normalized.name,
      age: normalized.age || null,
      blood_type: normalized.bloodType || null,
      city_phone: normalized.cityPhone || null,
      email: normalized.email || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "passport" });

    if (error) {
      console.error("[HPSR] Paciente não salvo no Supabase:", error.message);
      return false;
    }

    await refreshPatients();
    return true;
  }, [refreshPatients]);

  const selectPatient = useCallback((patientOrPassport: SharedPatient | string | null) => {
    const passport = normalizePassport(
      typeof patientOrPassport === "string" ? patientOrPassport : patientOrPassport?.passport,
    );
    setSelectedPassport(passport);
    if (passport) localStorage.setItem(SELECTED_PATIENT_KEY, passport);
    else localStorage.removeItem(SELECTED_PATIENT_KEY);

    // Selecionar nunca cria nem altera cadastro. Persistência acontece somente
    // nos fluxos explícitos de cadastro/edição, após confirmação do Supabase.
  }, []);

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
