"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

const departingSaves = new Map<string, Promise<void>>();

/** One private workspace per authenticated author. Publication remains explicit. */
export function useExamDraft<T extends Record<string, unknown>>(
  profileId: string, payload: T, restore: (value: T) => void,
  table: "exam_editor_drafts" | "document_editor_drafts" = "exam_editor_drafts",
) {
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loaded = useRef(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Carregando rascunho…");
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const ownerRef = useRef("");
  const tokenRef = useRef("");
  const acknowledged = useRef("");
  const pending = useRef<{ json: string; time: string } | null>(null);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clock = useRef(0);
  const mounted = useRef(true);

  const flight = useRef<Promise<void> | null>(null);
  function flush(): Promise<void> {
    if (flight.current) return flight.current;
    const save = performFlush().finally(() => { flight.current = null; });
    flight.current = save;
    return save;
  }

  async function performFlush() {
    if (running.current || !ownerRef.current || !pending.current) return;
    const client = createClient();
    if (!client) return;
    const owner = ownerRef.current;
    running.current = true;
    try {
      while (pending.current && ownerRef.current === owner) {
        const snapshot: { json: string; time: string } = pending.current;
        if (mounted.current) setStatus("Salvando rascunho…");
        const { error } = await client.from(table).upsert({
          owner_id: owner, payload: JSON.parse(snapshot.json),
          client_saved_at: snapshot.time,
        }, { onConflict: "owner_id" });
        if (error) throw error;
        acknowledged.current = snapshot.json;
        if (pending.current === snapshot) pending.current = null;
      }
      if (mounted.current) setStatus("Rascunho salvo");
    } catch {
      if (mounted.current) setStatus("Rascunho não salvo · tente novamente");
    } finally { running.current = false; }
  }

  function queue() {
    if (!loaded.current || !ownerRef.current) return;
    const json = JSON.stringify(payloadRef.current);
    if (json === acknowledged.current && !pending.current) return;
    clock.current = Math.max(Date.now(), clock.current + 1);
    pending.current = { json, time: new Date(clock.current).toISOString() };
    setStatus("Salvando rascunho…");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 400);
  }

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    setReady(false);
    loaded.current = false;
    ownerRef.current = "";
    pending.current = null;
    acknowledged.current = "";
    const client = createClient();
    if (!client || !/^[0-9a-f-]{36}$/i.test(profileId)) {
      setStatus("Rascunho indisponível · entre na sua conta");
      return;
    }
    const subscription = client.auth.onAuthStateChange((_event, session) => {
      tokenRef.current = session?.user.id === profileId ? session.access_token : "";
    }).data.subscription;
    void (async () => {
      try {
        await departingSaves.get(`${table}:${profileId}`);
        const { data: auth, error: authError } = await client.auth.getUser();
        if (authError || auth.user?.id !== profileId) throw new Error("Sessão inválida");
        const { data, error } = await client.from(table)
          .select("payload,client_saved_at").eq("owner_id", auth.user.id).maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        ownerRef.current = auth.user.id;
        if (data?.payload) {
          clock.current = Date.parse(data.client_saved_at) || 0;
          restoreRef.current(data.payload as T);
        }
        acknowledged.current = data?.payload ? JSON.stringify(data.payload) : "";
        loaded.current = true;
        setReady(true);
        setStatus(data ? "Rascunho recuperado" : "Sem rascunho anterior");
      } catch {
        if (!cancelled) { setReady(true); setStatus("Não foi possível carregar o rascunho · tente novamente"); }
      }
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      // Save the latest snapshot when navigating inside the application.
      if (loaded.current && ownerRef.current) {
        const json = JSON.stringify(payloadRef.current);
        if (pending.current || json !== acknowledged.current) {
          clock.current = Math.max(Date.now(), clock.current + 1);
          pending.current = { json, time: new Date(clock.current).toISOString() };
        }
      }
      const key = `${table}:${profileId}`;
      const save = flush();
      departingSaves.set(key, save);
      void save.finally(() => { if (departingSaves.get(key) === save) departingSaves.delete(key); });
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, table, loadAttempt]);

  useEffect(() => { if (ready) queue(); }, [ready, payload]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !loaded.current) return;
    const departure = () => {
      const json = JSON.stringify(payloadRef.current);
      if (!pending.current && json === acknowledged.current) return;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key || !tokenRef.current || !ownerRef.current) return;
      clock.current = Math.max(Date.now(), clock.current + 1);
      const body = JSON.stringify({ owner_id: ownerRef.current, payload: JSON.parse(json), client_saved_at: new Date(clock.current).toISOString() });
      // Browser keepalive requests are limited to about 64 KiB. Larger image
      // drafts use the normal autosave queue and the visible pending indicator.
      if (new Blob([body]).size > 60000) { void flush(); return; }
      void fetch(`${url}/rest/v1/${table}?on_conflict=owner_id`, {
        method: "POST", keepalive: true,
        headers: { apikey: key, Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body,
      }).catch(() => {});
    };
    const visibility = () => { if (document.visibilityState === "hidden") departure(); };
    window.addEventListener("pagehide", departure);
    document.addEventListener("visibilitychange", visibility);
    const retry = () => { void flush(); };
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("pagehide", departure);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, table]);

  return { ready, status, retry: () => loaded.current ? flush() : setLoadAttempt((attempt) => attempt + 1) };
}
