"use client";

import { useEffect, useMemo, useState } from "react";
import { Gauge, Loader2, Save } from "lucide-react";
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
    setMessage(result.ok ? "Capacidades atualizadas." : `Não foi possível salvar: ${result.error || "erro desconhecido"}`);
    setBusy(false);
  }

  if (!specialties.length) return null;

  return (
    <section className="rounded-[24px] border border-hpsr-border bg-white/[0.86] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Capacidade clínica</p>
          <h2 className="mt-1 text-lg font-black text-hpsr-text">Vagas por especialidade</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Defina quantos casos ativos você consegue acompanhar em cada área. Casos concluídos, cancelados ou encerrados liberam a vaga automaticamente.</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className="inline-flex min-h-[40px] items-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}Salvar capacidades</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {specialties.map((specialty) => {
          const snapshot = snapshots[specialty];
          const configuredLimit = Math.max(0, Math.min(99, Number(values[specialty] ?? 5)));
          const used = Number(snapshot?.used || 0);
          const available = Math.max(configuredLimit - used, 0);
          return <label key={specialty} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
            <span className="flex items-center gap-2 text-sm font-black text-hpsr-text"><Gauge size={16} className="text-hpsr-wine"/>{specialty}</span>
            <span className="mt-2 flex items-center gap-2"><input type="number" min="0" max="99" value={values[specialty] ?? 5} onChange={(event) => setValues((current) => ({ ...current, [specialty]: Number(event.target.value) }))} className="min-h-[40px] w-24 rounded-[12px] border border-hpsr-border bg-white px-3 text-sm font-black text-hpsr-text outline-none focus:border-hpsr-wine"/><span className="text-xs font-semibold text-hpsr-muted">limite de casos ativos</span></span>
            <span className={`mt-2 block text-xs font-black ${available > 0 ? "text-emerald-700" : "text-rose-700"}`}>{used}/{configuredLimit} · {available > 0 ? `${available} vaga${available === 1 ? "" : "s"}` : "Sem vagas"}</span>
          </label>;
        })}
      </div>
      {message && <p className="mt-3 rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-text">{message}</p>}
    </section>
  );
}
