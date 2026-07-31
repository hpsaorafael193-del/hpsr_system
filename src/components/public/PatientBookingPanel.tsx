"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, HeartPulse, Loader2, RefreshCcw, Stethoscope, X } from "lucide-react";

type Slot = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

export function PatientBookingPanel({ onSessionExpired, onBooked, passport }: { onSessionExpired?: () => void; onBooked?: () => void; passport?: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [emptyReason, setEmptyReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestInFlightRef = useRef<Promise<void> | null>(null);
  const lastLoadedAtRef = useRef(0);
  const onSessionExpiredRef = useRef(onSessionExpired);
  const onBookedRef = useRef(onBooked);

  useEffect(() => { onSessionExpiredRef.current = onSessionExpired; }, [onSessionExpired]);
  useEffect(() => { onBookedRef.current = onBooked; }, [onBooked]);

  const load = useCallback(async (force = false) => {
    if (!force && Date.now() - lastLoadedAtRef.current < 15000) return;
    if (requestInFlightRef.current) return requestInFlightRef.current;
    const request = (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/paciente/horarios${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { cache: "no-store" });
        const data = await response.json();
        if (response.status === 401) { onSessionExpiredRef.current?.(); return; }
        if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar horários.");
        setSlots(data.slots || []);
        setPatientName(String(data.patientName || ""));
        setEmptyReason(String(data.diagnostics?.reason || ""));
        lastLoadedAtRef.current = Date.now();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Falha ao carregar horários.");
      } finally {
        setLoading(false);
      }
    })();
    requestInFlightRef.current = request;
    try { await request; } finally { requestInFlightRef.current = null; }
  }, [passport]);

  useEffect(() => { void load(true); }, [load]);

  const grouped = useMemo(() => slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = new Date(slot.starts_at).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    (acc[key] ??= []).push(slot);
    return acc;
  }, {}), [slots]);

  const selectedSlot = slots.find((slot) => slot.id === selected) || null;

  async function book() {
    if (!selectedSlot) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/paciente/reservar-horario${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível escolher e confirmar o horário.");
      setMessage(`Horário escolhido e confirmado com ${data.doctorName || selectedSlot.doctor_name}.`);
      setSelected("");
      setConfirmOpen(false);
      await load(true);
      onBookedRef.current?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível escolher e confirmar o horário.");
      setConfirmOpen(false);
      await load(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-hpsr-border bg-white shadow-[0_16px_38px_rgba(82,48,27,.07)]">
        <div className="relative overflow-hidden border-b border-hpsr-border bg-[linear-gradient(135deg,#401208_0%,#6d2413_100%)] p-4 text-white">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-white/[.055]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-white/15 bg-white/10 text-white"><HeartPulse size={19} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/60">Agenda dos especialistas</p>
                <h3 className="mt-0.5 text-lg font-black text-white">Horários disponíveis</h3>
                <p className="mt-1 max-w-xl text-xs font-semibold leading-relaxed text-white/72">Escolha uma vaga da especialidade liberada no seu prontuário. Confira sempre o nome do médico antes de confirmar.</p>
              </div>
            </div>
            <button onClick={() => void load(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-white/15 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15"><RefreshCcw size={14} />Atualizar</button>
          </div>
        </div>

        <div className="p-3.5">
          <div className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3.5 py-2.5 text-sm font-bold text-hpsr-text shadow-sm">Paciente: {patientName || "Identificado pela sessão"}</div>
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-hpsr-wine" /></div>
          ) : !slots.length ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-hpsr-border bg-[linear-gradient(180deg,#fffdf9,#fff8f1)] p-7 text-center">
              <CalendarDays className="mx-auto text-hpsr-wine" />
              <p className="mt-3 font-black text-hpsr-text">Nenhum horário disponível</p>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-hpsr-muted">{emptyReason || "Quando um médico publicar horários para uma especialidade liberada no seu prontuário, as opções aparecerão aqui."}</p>
            </div>
          ) : (
            <div className="hpsr-touch-scroll mt-3 max-h-[440px] space-y-3 overflow-y-auto pr-1">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day} className="rounded-[16px] border border-hpsr-border bg-[#fffdf9] p-3 shadow-[0_8px_20px_rgba(82,48,27,.035)]">
                  <div className="mb-2.5 flex items-center gap-2"><CalendarDays size={16} className="text-hpsr-wine" /><h4 className="capitalize text-sm font-black text-hpsr-text">{day}</h4></div>
                  <div className="space-y-2">
                    {items.map((slot) => {
                      const active = selected === slot.id;
                      const time = new Date(slot.starts_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
                      return (
                        <button key={slot.id} onClick={() => setSelected(slot.id)} className={`w-full rounded-[14px] border px-3.5 py-3 text-left transition duration-200 ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_9px_20px_rgba(103,38,20,.16)]" : "border-hpsr-border bg-white text-hpsr-text hover:border-hpsr-wineLight hover:bg-[#fff8f4] hover:shadow-sm"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] ${active ? "bg-white/15" : "bg-[#f7ede3] text-hpsr-wine"}`}><Clock3 size={17} /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-base font-black">{time}</span><span className={`text-[10px] font-black uppercase tracking-[.11em] ${active ? "text-white/75" : "text-hpsr-wineLight"}`}>{slot.specialty}</span></div>
                              <div className={`mt-2 rounded-[10px] border px-2.5 py-2 ${active ? "border-white/15 bg-white/10" : "border-[#ead7ca] bg-[#fffaf4]"}`}>
                                <p className={`text-[9px] font-black uppercase tracking-[.12em] ${active ? "text-white/65" : "text-hpsr-wineLight"}`}>Médico responsável por este horário</p>
                                <p className={`mt-0.5 truncate text-sm font-black ${active ? "text-white" : "text-hpsr-text"}`}><Stethoscope className="mr-1 inline" size={13} />{slot.doctor_name}</p>
                              </div>
                            </div>
                            <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${active ? "border-white bg-white" : "border-hpsr-border bg-white"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && <p className="mt-4 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
          {error && <p className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
          <button disabled={saving || !selectedSlot || !patientName.trim()} onClick={() => setConfirmOpen(true)} className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-hpsr-wine px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50"><CheckCircle2 size={17} />Escolher e confirmar horário</button>
        </div>
      </section>

      {confirmOpen && selectedSlot && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[#2a0700]/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-t-[24px] border border-white/80 bg-white shadow-2xl sm:rounded-[24px]">
            <div className="flex items-start justify-between bg-[linear-gradient(135deg,#401208,#6d2413)] px-5 py-4 text-white">
              <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-white/65">Confirmação da vaga</p><h3 className="mt-1 text-xl font-black">Confirmar atendimento</h3></div>
              <button type="button" onClick={() => setConfirmOpen(false)} className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/20 bg-white/10"><X size={17} /></button>
            </div>
            <div className="p-5">
              <p className="text-base font-black leading-relaxed text-hpsr-text">Você tem certeza que quer escolher e confirmar este horário com o médico <span className="text-hpsr-wine">{selectedSlot.doctor_name}</span>?</p>
              <div className="mt-4 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
                <p className="text-sm font-black text-hpsr-text">{new Date(selectedSlot.starts_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                <p className="mt-1 text-2xl font-black text-hpsr-wine">{new Date(selectedSlot.starts_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="mt-2 text-sm font-semibold text-hpsr-muted">{selectedSlot.specialty}</p>
              </div>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-hpsr-muted">Ao confirmar, a vaga será vinculada ao seu prontuário e deixará de ficar disponível para outros pacientes.</p>
            </div>
            <div className="flex gap-3 border-t border-hpsr-border bg-[#fffaf4] p-4">
              <button type="button" disabled={saving} onClick={() => setConfirmOpen(false)} className="min-h-[46px] flex-1 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-text">Cancelar</button>
              <button type="button" disabled={saving} onClick={() => void book()} className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
