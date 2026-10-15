"use client";

import { useEffect, useMemo, useState } from "react";
import { Stethoscope, Loader2, Save } from "lucide-react";
import styles from "./ClinicalCapacitySettings.module.css";
import { createClient } from "@/lib/supabase";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";

type CapacitySnapshot = { limit: number; used: number; available: number; full: boolean };

export function ClinicalCapacitySettings() {
  const { profile, updateProfile } = useCurrentUserProfile();
  const specialties = useMemo(
    () => [...new Set((profile.specialties || []).map((item) => String(item).trim()).filter((item) => item && item !== "Não informado"))],
    [profile.specialties],
  );
  const [values, setValues] = useState<Record<string, number>>({});
  const [snapshots, setSnapshots] = useState<Record<string, CapacitySnapshot>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const next: Record<string, number> = {};
    specialties.forEach((specialty) => {
      next[specialty] = Number(profile.specialtyCapacity?.[specialty] ?? 5);
    });
    setValues(next);
  }, [profile.specialtyCapacity, specialties]);

  useEffect(() => {
    const client = createClient();
    if (!client || !profile.id || !specialties.length) return;
    let active = true;
    void Promise.all(specialties.map(async (specialty) => {
      const { data } = await client.rpc("hpsr_my_clinical_capacity", { p_specialty: specialty });
      return [specialty, data as CapacitySnapshot] as const;
    })).then((entries) => {
      if (active) setSnapshots(Object.fromEntries(entries.filter(([, value]) => value)));
    });
    return () => { active = false; };
  }, [profile.id, specialties]);

  async function save() {
    setBusy(true);
    setMessage("");
    const normalized = Object.fromEntries(specialties.map((specialty) => [specialty, Math.max(0, Math.min(99, Number(values[specialty]) || 0))]));
    const result = await updateProfile({ specialtyCapacity: normalized });
    setMessage(result.ok ? "Limites de pacientes atualizados." : `Não foi possível salvar: ${result.error || "erro desconhecido"}`);
    setBusy(false);
  }

  if (!specialties.length) return null;

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Capacidade clínica</p>
          <h2 className="mt-1 text-lg font-black text-hpsr-text">Vagas por especialidade</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Defina o máximo de pacientes com vínculo ativo em cada especialidade. Consultas e acompanhamentos não ocupam vagas adicionais; encerrar o vínculo libera a vaga.</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className={styles.save}>{busy ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}Salvar capacidades</button>
      </div>
      <div className={styles.grid}>
        {specialties.map((specialty) => {
          const snapshot = snapshots[specialty];
          const configuredLimit = Math.max(0, Math.min(99, Number(values[specialty] ?? 5)));
          const used = Number(snapshot?.used || 0);
          const available = Math.max(configuredLimit - used, 0);
          return <label key={specialty} className={styles.card}>
            <span className="flex items-center gap-2 text-sm font-black text-hpsr-text"><span className={styles.icon}><Stethoscope size={19}/></span>{specialty}</span>
            <span className={styles.inputRow}><input type="number" min="0" max="99" value={values[specialty] ?? 5} onChange={(event) => setValues((current) => ({ ...current, [specialty]: Number(event.target.value) }))} className={styles.input}/><span className="text-xs font-semibold text-hpsr-muted">limite de pacientes vinculados</span></span>
            <span className={`mt-2 block text-xs font-black ${available > 0 ? "text-emerald-700" : "text-rose-700"}`}>{used}/{configuredLimit} · {available > 0 ? `${available} vaga${available === 1 ? "" : "s"}` : "Sem vagas"}</span>
          </label>;
        })}
      </div>
      {message && <p role="status" className={styles.message}>{message}</p>}
    </section>
  );
}
