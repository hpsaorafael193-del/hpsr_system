"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Eye, EyeOff, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";

type HistoryItem = {
  id: string;
  title: string;
  patient: string;
  doctor: string;
  createdAt: string;
  isConfidential: boolean;
};

type PreviewState = {
  title: string;
  html?: string;
  images?: string[];
} | null;

export function ClinicalHistoryPanel({ recordType, comfortable = false }: { recordType: "Exame" | "Documento"; comfortable?: boolean }) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [visibilitySavingId, setVisibilitySavingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const canDelete = currentUserProfile.systemRole === "Administrador do Sistema"
    || ["Diretora", "Vice Diretor", "Vice Diretor / Dev"].includes(currentUserProfile.role);

  async function loadHistory() {
    const client = createClient();
    if (!client) {
      setLoadError("Supabase não configurado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    const { data, error } = await client
      .from("clinical_records")
      .select("id,record_type,created_at,history_title,history_patient_name,history_doctor_name,is_confidential")
      .in("record_type", recordType === "Exame" ? ["Exame", "exame"] : ["Documento", "documento"])
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) {
      setItems([]);
      setLoadError(error.message || "Não foi possível carregar o histórico.");
      setLoading(false);
      return;
    }
    setItems((data || []).map((row: any) => ({
      id: String(row.id),
      title: String(row.history_title || recordType),
      patient: String(row.history_patient_name || "Paciente não informado"),
      doctor: String(row.history_doctor_name || "Médico não informado"),
      createdAt: String(row.created_at || ""),
      isConfidential: Boolean(row.is_confidential),
    })));
    setLoading(false);
  }

  useEffect(() => {
    void loadHistory();
    const refresh = () => void loadHistory();
    window.addEventListener("hpsr:clinical-record-saved", refresh);
    window.addEventListener("hpsr:clinical-record-deleted", refresh);
    return () => {
      window.removeEventListener("hpsr:clinical-record-saved", refresh);
      window.removeEventListener("hpsr:clinical-record-deleted", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordType]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return items;
    return items.filter((item) => `${item.title} ${item.patient} ${item.doctor}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [items, search]);

  async function toggleConfidentiality(item: HistoryItem) {
    const client = createClient();
    if (!client) return;
    const nextConfidential = !item.isConfidential;
    const confirmed = await hpsrConfirm(
      nextConfidential
        ? "Colocar este registro em sigilo para o paciente? Ele continuará visível normalmente para a equipe autorizada."
        : "Liberar este registro para o paciente? Ele ficará disponível no Portal do Paciente.",
      nextConfidential ? "Sigilo no Portal" : "Liberar ao paciente",
    );
    if (!confirmed) return;
    setVisibilitySavingId(item.id);
    const { error } = await client.rpc("set_clinical_record_confidentiality", {
      target_record_id: item.id,
      confidential: nextConfidential,
    });
    setVisibilitySavingId(null);
    if (error) {
      await hpsrAlert(error.message, "Não foi possível alterar a visibilidade");
      return;
    }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isConfidential: nextConfidential } : entry));
  }

  async function openItem(item: HistoryItem) {
    const client = createClient();
    if (!client) return;
    const { data, error } = await client.from("clinical_records").select("payload").eq("id", item.id).maybeSingle();
    if (error) {
      await hpsrAlert(error.message, "Não foi possível abrir o registro");
      return;
    }
    const payload = (data?.payload || {}) as Record<string, any>;
    const images = Array.isArray(payload.previewImages)
      ? payload.previewImages.filter((value: unknown) => typeof value === "string" && value.startsWith("data:image/"))
      : typeof payload.previewImage === "string" && payload.previewImage.startsWith("data:image/")
        ? [payload.previewImage]
        : [];
    setPreview({
      title: item.title,
      html: String(payload.reportHtml || payload.documentHtml || ""),
      images,
    });
  }

  async function deleteItem(item: HistoryItem) {
    const confirmed = await hpsrConfirm(`Deseja excluir definitivamente “${item.title}”?`, recordType === "Exame" ? "Excluir exame" : "Excluir documento");
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("clinical_records").delete().eq("id", item.id);
    if (error) {
      await hpsrAlert(error.message, "Não foi possível excluir");
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    window.dispatchEvent(new CustomEvent("hpsr:clinical-record-deleted", { detail: { id: item.id, recordType } }));
  }

  return (
    <section className={`rounded-[20px] border p-3 shadow-[0_6px_18px_rgba(42,7,0,0.035)] sm:p-4 ${comfortable ? "hpsr-exams-history border-[#e1d5bf] bg-[#fffaf3]" : "border-[#e6ddd6] bg-white"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ebe6] pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock3 size={14} className="text-hpsr-wine" />
            <h2 className="text-sm font-black text-hpsr-text">{recordType === "Exame" ? "Histórico de exames" : "Histórico de documentos"}</h2>
            <span className="rounded-full bg-[#f6eee8] px-2 py-0.5 text-[9px] font-black text-hpsr-wine">{filtered.length}</span>
          </div>
          <p className="mt-1 text-[10px] font-semibold text-hpsr-muted">O sigilo controla apenas a visualização no Portal do Paciente.</p>
        </div>
        <div className="flex h-9 min-w-[210px] items-center gap-2 rounded-[11px] border border-hpsr-border bg-[#fffdfb] px-3 focus-within:border-hpsr-wine/40">
          <Search size={14} className="text-hpsr-wine" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar histórico" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-hpsr-muted/70" />
        </div>
      </div>

      <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
        {loading ? (
          <p className="py-8 text-center text-xs font-bold text-hpsr-muted">Carregando histórico...</p>
        ) : loadError ? (
          <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-center text-xs font-bold text-rose-700">Não foi possível carregar o histórico: {loadError}</p>
        ) : filtered.length ? (
          <div className="grid gap-1.5">
            {filtered.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#ebe3dc] bg-[#fffdfb] px-3 py-2 transition hover:border-hpsr-wine/20 hover:bg-white">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-xs font-black text-hpsr-text">{item.title}</p>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black ${item.isConfidential ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                      {item.isConfidential ? "SIGILO" : "PORTAL"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-hpsr-muted">{item.patient}</p>
                  <p className="mt-0.5 text-[9px] font-bold text-hpsr-wineLight">{item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Data não informada"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => void openItem(item)} title={`Ver ${recordType.toLowerCase()}`} className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-hpsr-border bg-white px-2.5 text-[10px] font-black text-hpsr-text hover:border-hpsr-wine/30"><Eye size={13} /> Ver</button>
                  <button type="button" disabled={visibilitySavingId === item.id} onClick={() => void toggleConfidentiality(item)} title={item.isConfidential ? "Liberar ao paciente" : "Colocar em sigilo"} className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-hpsr-wine/15 bg-[#fff8f1] px-2.5 text-[10px] font-black text-hpsr-wine disabled:opacity-50">
                    {item.isConfidential ? <><Eye size={13} /> Liberar</> : <><EyeOff size={13} /> Sigilo</>}
                  </button>
                  {canDelete ? <button type="button" onClick={() => void deleteItem(item)} title="Excluir" className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-rose-200 bg-rose-50 text-rose-700"><Trash2 size={13} /></button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-xs font-bold text-hpsr-muted">Nenhum registro encontrado.</p>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
          <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-hpsr-border px-4 py-3">
              <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Registro salvo</p><h3 className="text-lg font-black text-hpsr-text">{preview.title}</h3></div>
              <button type="button" onClick={() => setPreview(null)} className="rounded-full border border-hpsr-border bg-white p-2 text-hpsr-wine"><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f0ed] p-4 sm:p-6">
              {preview.images?.length ? (
                <div className="space-y-4">{preview.images.map((image, index) => <img key={index} src={image} alt={`Página ${index + 1}`} className="mx-auto block w-full max-w-[794px] bg-white shadow-xl" />)}</div>
              ) : preview.html ? (
                <div className="mx-auto max-w-[794px] bg-white p-8 shadow-xl" dangerouslySetInnerHTML={{ __html: preview.html }} />
              ) : (
                <p className="rounded-[14px] bg-white p-6 text-center text-sm font-bold text-hpsr-muted">Este registro não possui pré-visualização disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
