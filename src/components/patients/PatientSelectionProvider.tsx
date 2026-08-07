"use client";
import { formatPhoneDisplay } from "@/lib/phone";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { notifyPatientRegistryUpdated, subscribePatientRegistryUpdated } from "@/lib/patient-sync";

export type SharedPatient = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  cityPhone?: string;
  email?: string;
};

type PatientRegistryRow = {
  passport: string | null;
  name: string | null;
  age: string | null;
  blood_type: string | null;
  city_phone: string | null;
  email: string | null;
  created_at: string | null;
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
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const refreshQueuedRef = useRef<number | null>(null);

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
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const request = (async () => {
      const client = createClient();
      if (!client) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await client.rpc("list_patient_registry_staff");

      if (error) {
        console.error("[HPSR] Falha ao sincronizar pacientes:", error.message);
        setLoading(false);
        return;
      }

      lastRefreshAtRef.current = Date.now();
      const rows = (data ?? []) as PatientRegistryRow[];
      const authoritative = rows
        .map((row: PatientRegistryRow) => normalizePatient({
          passport: row.passport ?? undefined,
          name: row.name ?? undefined,
          age: row.age ?? undefined,
          bloodType: row.blood_type ?? undefined,
          cityPhone: formatPhoneDisplay(row.city_phone ?? undefined, ""),
          email: row.email ?? undefined,
        }))
        .filter(Boolean) as SharedPatient[];

      authoritative.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      setPatients((current) => {
        if (!authoritative.length && current.length) {
          console.warn("[HPSR] Resposta vazia inesperada ao sincronizar pacientes; mantendo cache atual.");
          return current;
        }
        writePatientCache(authoritative);
        return authoritative;
      });
      setLoading(false);
    })();

    refreshInFlightRef.current = request;
    try {
      await request;
    } finally {
      refreshInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    const requestRefresh = (force = false) => {
      const elapsed = Date.now() - lastRefreshAtRef.current;
      if (force || elapsed >= 5000) {
        void refreshPatients();
        return;
      }
      if (refreshQueuedRef.current !== null) return;
      refreshQueuedRef.current = window.setTimeout(() => {
        refreshQueuedRef.current = null;
        void refreshPatients();
      }, 5000 - elapsed);
    };

    requestRefresh(true);
    const unsubscribeLocal = subscribePatientRegistryUpdated(() => requestRefresh());
    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      requestRefresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    const client = createClient();
    if (!client) {
      return () => {
        unsubscribeLocal();
        document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        window.removeEventListener("focus", handleVisibilityOrFocus);
        if (refreshQueuedRef.current !== null) window.clearTimeout(refreshQueuedRef.current);
      };
    }
    const channel = client
      .channel("shared-patient-selection")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_registry" }, () => requestRefresh())
      .subscribe();
    return () => {
      unsubscribeLocal();
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      if (refreshQueuedRef.current !== null) window.clearTimeout(refreshQueuedRef.current);
      void client.removeChannel(channel);
    };
  }, [refreshPatients]);

  const upsertPatient = useCallback(async (patient: SharedPatient) => {
    const normalized = normalizePatient(patient);
    if (!normalized) return false;

    const client = createClient();
    if (!client) return false;

    const { error } = await client.rpc("upsert_patient_registry_staff", {
      p_passport: normalized.passport,
      p_name: normalized.name,
      p_age: normalized.age || null,
      p_blood_type: normalized.bloodType || null,
      p_city_phone: normalized.cityPhone || null,
      p_email: normalized.email || null,
    });

    if (error) {
      console.error("[HPSR] Paciente não salvo no Supabase:", error.message);
      return false;
    }

    setPatients((current) => {
      const next = current.filter((item) => item.passport !== normalized.passport);
      next.push(normalized);
      next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      writePatientCache(next);
      return next;
    });
    // O Realtime central fará uma conferência posterior; evitamos uma segunda
    // leitura completa logo após a gravação.
    return true;
  }, []);

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
