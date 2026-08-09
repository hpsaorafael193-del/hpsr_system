"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Handshake,
  HeartHandshake,
  IdCard,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { registerSystemActivity } from "@/lib/administrative-storage";

type PartnershipStatus = "Ativa" | "Inativa";

type PartnershipMember = {
  name: string;
  passport: string;
};

type Partnership = {
  id: string;
  institutionName: string;
  institutionType: string;
  summary: string;
  formedAt: string;
  hpOfferSummary: string;
  partnerOfferSummary: string;
  hpDiscountPercent?: number;
  partnerDiscountPercent?: number;
  offDutyService: boolean;
  members: PartnershipMember[];
  terms: string[];
  notes: string;
  status: PartnershipStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type PartnershipDraft = Omit<Partnership, "id" | "createdAt" | "updatedAt">;

const directorRoles = ["Diretora", "Vice Diretor"];
const inputClass = "w-full rounded-[15px] border border-hpsr-border bg-white px-3.5 py-2.5 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/15";
const labelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight";

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDraft(createdBy?: string): PartnershipDraft {
  return {
    institutionName: "",
    institutionType: "",
    summary: "",
    formedAt: todayIso(),
    hpOfferSummary: "",
    partnerOfferSummary: "",
    hpDiscountPercent: undefined,
    partnerDiscountPercent: undefined,
    offDutyService: false,
    members: [],
    terms: [],
    notes: "",
    status: "Ativa",
    createdBy,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function toMembers(value: unknown): PartnershipMember[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      return {
        name: String(record.name || record.nome || "").trim(),
        passport: String(record.passport || record.passaporte || "").trim(),
      };
    }
    const raw = String(item || "").trim();
    const match = raw.match(/^(.+?)\s*(?:[—–|-]|\|)\s*(?:passaporte\s*:?\s*)?([A-Za-z0-9._/-]+)$/i);
    return { name: (match?.[1] || raw).trim(), passport: (match?.[2] || "").trim() };
  }).filter((member) => member.name || member.passport);
}

function mapRow(row: Record<string, unknown>): Partnership {
  const hpDiscount = Number(row.hp_discount_percent);
  const partnerDiscount = Number(row.partner_discount_percent);
  return {
    id: String(row.id || ""),
    institutionName: String(row.institution_name || "Instituição"),
    institutionType: String(row.institution_type || ""),
    summary: String(row.summary || ""),
    formedAt: String(row.formed_at || ""),
    hpOfferSummary: String(row.hp_offer_summary || ""),
    partnerOfferSummary: String(row.partner_offer_summary || ""),
    hpDiscountPercent: Number.isFinite(hpDiscount) ? hpDiscount : undefined,
    partnerDiscountPercent: Number.isFinite(partnerDiscount) ? partnerDiscount : undefined,
    offDutyService: Boolean(row.off_duty_service),
    members: toMembers(row.members),
    terms: toStringArray(row.terms),
    notes: String(row.notes || ""),
    status: row.status === "Inativa" ? "Inativa" : "Ativa",
    createdBy: row.created_by ? String(row.created_by) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function formatDate(value: string) {
  if (!value) return "Não informada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function parseLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractPercent(value: string) {
  const match = (value || "").match(/(?:^|\s)(\d{1,3}(?:[.,]\d{1,2})?)\s*%/);
  if (!match) return undefined;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : undefined;
}

function offerBadge(summary: string, legacyPercent?: number) {
  const parsed = extractPercent(summary);
  const value = parsed ?? legacyPercent;
  return value != null ? `${String(value).replace(".", ",")}%` : "Ver termos";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
}

export default function PartnershipsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [items, setItems] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Partnership | null>(null);
  const [editing, setEditing] = useState<Partnership | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<PartnershipDraft>(() => initialDraft());
  const [termsText, setTermsText] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberPassport, setMemberPassport] = useState("");

  const canManage = currentUserProfile.systemRole === "Diretor Técnico / Dev" || directorRoles.includes(currentUserProfile.role);

  const load = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const client = createClient();
    if (!client) {
      setLoading(false);
      return;
    }
    const { data, error } = await client
      .from("partnerships")
      .select("id,institution_name,institution_type,summary,formed_at,hp_offer_summary,partner_offer_summary,hp_discount_percent,partner_discount_percent,off_duty_service,members,terms,notes,status,created_by,created_at,updated_at")
      .order("status", { ascending: true })
      .order("formed_at", { ascending: false });
    if (error) {
      await hpsrAlert(`Não foi possível carregar as parcerias: ${error.message}`, "Parcerias");
      setItems([]);
    } else {
      setItems((data || []).map((row) => mapRow(row as Record<string, unknown>)));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("pt-BR");
    if (!q) return items;
    return items.filter((item) => [
      item.institutionName,
      item.institutionType,
      item.summary,
      item.hpOfferSummary,
      item.partnerOfferSummary,
      ...item.members.flatMap((member) => [member.name, member.passport]),
      ...item.terms,
    ].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [items, search]);

  const openCreate = () => {
    const next = initialDraft(currentUserProfile.id || undefined);
    setDraft(next);
    setTermsText("");
    setMemberName("");
    setMemberPassport("");
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (item: Partnership) => {
    setDraft({
      institutionName: item.institutionName,
      institutionType: item.institutionType,
      summary: item.summary,
      formedAt: item.formedAt,
      hpOfferSummary: item.hpOfferSummary,
      partnerOfferSummary: item.partnerOfferSummary,
      hpDiscountPercent: item.hpDiscountPercent,
      partnerDiscountPercent: item.partnerDiscountPercent,
      offDutyService: item.offDutyService,
      members: item.members,
      terms: item.terms,
      notes: item.notes,
      status: item.status,
      createdBy: item.createdBy,
    });
    setTermsText(item.terms.join("\n"));
    setMemberName("");
    setMemberPassport("");
    setEditing(item);
    setSelected(null);
    setCreating(true);
  };

  const addMember = () => {
    const name = memberName.trim();
    const passport = memberPassport.trim();
    if (!name || !passport) return;
    setDraft((current) => ({
      ...current,
      members: [...current.members, { name, passport }],
    }));
    setMemberName("");
    setMemberPassport("");
  };

  const save = async () => {
    if (!canManage) return;
    if (!draft.institutionName.trim()) {
      await hpsrAlert("Informe o nome da instituição.", "Parcerias");
      return;
    }
    if (!isSupabaseConfigured()) {
      await hpsrAlert("Supabase não configurado neste ambiente.", "Parcerias");
      return;
    }
    const client = createClient();
    if (!client) return;
    const members = draft.members
      .map((member) => ({ name: member.name.trim(), passport: member.passport.trim() }))
      .filter((member) => member.name || member.passport);
    const invalidMember = members.find((member) => !member.name || !member.passport);
    if (invalidMember) {
      await hpsrAlert("Informe nome e passaporte de todos os integrantes da instituição.", "Parcerias");
      return;
    }
    const terms = parseLines(termsText);
    const payload = {
      institution_name: draft.institutionName.trim(),
      institution_type: draft.institutionType.trim() || null,
      summary: draft.summary.trim() || null,
      formed_at: draft.formedAt || todayIso(),
      hp_offer_summary: draft.hpOfferSummary.trim() || null,
      partner_offer_summary: draft.partnerOfferSummary.trim() || null,
      hp_discount_percent: extractPercent(draft.hpOfferSummary) ?? null,
      partner_discount_percent: extractPercent(draft.partnerOfferSummary) ?? null,
      off_duty_service: draft.offDutyService,
      members,
      terms,
      notes: draft.notes.trim() || null,
      status: draft.status,
      created_by: editing?.createdBy || currentUserProfile.id || null,
    };
    setSaving(true);
    if (editing) {
      const { data, error } = await client.from("partnerships").update(payload).eq("id", editing.id).select("*").single();
      if (error) {
        setSaving(false);
        await hpsrAlert(`Não foi possível atualizar a parceria: ${error.message}`, "Parcerias");
        return;
      }
      const mapped = mapRow(data as Record<string, unknown>);
      setItems((current) => current.map((item) => item.id === mapped.id ? mapped : item));
      await registerSystemActivity({ module: "Parcerias", action: "Parceria atualizada", description: `Parceria com ${mapped.institutionName} atualizada.`, actor: currentUserProfile.systemName, reference: mapped.id });
    } else {
      const { data, error } = await client.from("partnerships").insert(payload).select("*").single();
      if (error) {
        setSaving(false);
        await hpsrAlert(`Não foi possível registrar a parceria: ${error.message}`, "Parcerias");
        return;
      }
      const mapped = mapRow(data as Record<string, unknown>);
      setItems((current) => [mapped, ...current]);
      await registerSystemActivity({ module: "Parcerias", action: "Parceria cadastrada", description: `Parceria com ${mapped.institutionName} cadastrada.`, actor: currentUserProfile.systemName, reference: mapped.id });
    }
    setSaving(false);
    setCreating(false);
    setEditing(null);
  };

  const remove = async (item: Partnership) => {
    if (!canManage) return;
    if (!(await hpsrConfirm(`Excluir a parceria com ${item.institutionName}?`, "Excluir parceria"))) return;
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("partnerships").delete().eq("id", item.id);
    if (error) {
      await hpsrAlert(`Não foi possível excluir a parceria: ${error.message}`, "Parcerias");
      return;
    }
    setItems((current) => current.filter((row) => row.id !== item.id));
    setSelected(null);
    await registerSystemActivity({ module: "Parcerias", action: "Parceria excluída", description: `Parceria com ${item.institutionName} excluída.`, actor: currentUserProfile.systemName, reference: item.id });
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Relacionamento institucional"
        title="Parcerias"
        description="Instituições parceiras, benefícios, integrantes e termos acordados com o Hospital São Rafael."
      />

      <section className="rounded-[24px] border border-hpsr-border bg-white/90 p-4 shadow-[0_14px_40px_rgba(76,33,15,.06)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f2e5d8] text-hpsr-wine"><HeartHandshake size={22} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Parcerias</p>
              <p className="mt-0.5 text-base font-black text-hpsr-text">Rede de parceiros</p>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{items.filter((item) => item.status === "Ativa").length} parceria(s) ativa(s) · visualização liberada para toda a equipe</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 sm:w-[310px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hpsr-wineLight" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar instituição, membro ou termo" className={`${inputClass} pl-9`} />
            </label>
            {canManage && (
              <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-[15px] bg-hpsr-wine px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-110">
                <Plus size={16} /> Nova parceria
              </button>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[24px] border border-hpsr-border bg-white p-8 text-center text-sm font-bold text-hpsr-muted">Carregando parcerias...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-hpsr-border bg-white/80 p-8 text-center">
          <Handshake size={28} className="mx-auto text-hpsr-wineLight" />
          <p className="mt-3 text-sm font-black text-hpsr-text">Nenhuma parceria encontrada</p>
          <p className="mt-1 text-xs font-semibold text-hpsr-muted">Os registros ativos e históricos aparecerão aqui em cards.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item)} className="group flex min-h-[238px] flex-col rounded-[24px] border border-hpsr-border bg-white p-5 text-left shadow-[0_12px_34px_rgba(76,33,15,.055)] transition hover:-translate-y-0.5 hover:border-hpsr-wineLight/60 hover:shadow-[0_18px_38px_rgba(76,33,15,.09)]">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-[#e2cbb5] bg-[#f7ede4] text-base font-black text-hpsr-wine">{initials(item.institutionName)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15px] font-black text-hpsr-text">{item.institutionName}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${item.status === "Ativa" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-bold text-hpsr-wineLight">{item.institutionType || "Instituição parceira"}</p>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 min-h-[54px] text-xs font-semibold leading-5 text-hpsr-muted">{item.summary || item.partnerOfferSummary || "Clique para consultar os detalhes e termos desta parceria."}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[14px] border border-[#ead8c8] bg-[#fbf6f1] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight"><BadgePercent size={12} /> HP oferece</div>
                  <p className="mt-1 text-sm font-black text-hpsr-wine">{offerBadge(item.hpOfferSummary, item.hpDiscountPercent)}</p>
                </div>
                <div className="rounded-[14px] border border-[#ead8c8] bg-[#fbf6f1] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight"><HeartHandshake size={12} /> Parceiro oferece</div>
                  <p className="mt-1 text-sm font-black text-hpsr-wine">{offerBadge(item.partnerOfferSummary, item.partnerDiscountPercent)}</p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-[#eee2d8] pt-3 text-[10px] font-bold text-hpsr-muted">
                <span className="inline-flex items-center gap-1"><UsersRound size={12} /> {item.members.length} integrante(s)</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(item.formedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!canManage && (
        <div className="rounded-[18px] border border-[#e8d7c7] bg-[#fbf6f1] px-4 py-3 text-xs font-semibold text-hpsr-muted">
          <ShieldCheck size={15} className="mr-2 inline text-hpsr-wine" /> O cadastro e a edição de parcerias são restritos à Diretora, Vice Diretor e Diretor Técnico / Dev.
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[26px] border border-hpsr-border bg-[#fffdfb] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-hpsr-border bg-[#fffdfb]/95 p-5 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#f2e5d8] font-black text-hpsr-wine">{initials(selected.institutionName)}</div>
                <div className="min-w-0"><h2 className="truncate text-lg font-black text-hpsr-text">{selected.institutionName}</h2><p className="text-xs font-bold text-hpsr-wineLight">{selected.institutionType || "Instituição parceira"} · parceria desde {formatDate(selected.formedAt)}</p></div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-hpsr-border text-hpsr-wine"><X size={17} /></button>
            </div>

            <div className="space-y-5 p-5">
              {selected.summary && <p className="rounded-[18px] border border-[#ead9ca] bg-[#fbf6f1] p-4 text-sm font-semibold leading-6 text-hpsr-text">{selected.summary}</p>}

              <div className="grid gap-3 md:grid-cols-2">
                <DetailBlock icon={<BadgePercent size={16} />} title="O Hospital oferece" value={selected.hpOfferSummary || (selected.hpDiscountPercent != null ? `${selected.hpDiscountPercent}% de desconto.` : "Não especificado.")} />
                <DetailBlock icon={<HeartHandshake size={16} />} title="O parceiro oferece" value={selected.partnerOfferSummary || (selected.partnerDiscountPercent != null ? `${selected.partnerDiscountPercent}% de desconto.` : "Não especificado.")} />
              </div>

              {selected.offDutyService && (
                <div className="flex items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><div><p className="text-xs font-black uppercase tracking-[0.12em]">Benefício oferecido pelo parceiro</p><p className="mt-1 text-xs font-semibold leading-5">A instituição parceira informou atendimento aos membros do HP mesmo quando seus próprios integrantes estiverem fora de serviço. Este benefício nunca representa atendimento do Hospital São Rafael fora de serviço.</p></div></div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <MemberListBlock members={selected.members} />
                <ListBlock title="Termos da parceria" icon={<Handshake size={16} />} values={selected.terms} empty="Nenhum termo adicional informado." />
              </div>

              {selected.notes && <DetailBlock icon={<Building2 size={16} />} title="Observações" value={selected.notes} />}

              {canManage && (
                <div className="flex flex-col gap-2 border-t border-hpsr-border pt-4 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-xs font-black text-hpsr-wine"><Edit3 size={15} /> Editar</button>
                  <button type="button" onClick={() => void remove(selected)} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700"><Trash2 size={15} /> Excluir</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {creating && canManage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px]">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[26px] border border-hpsr-border bg-[#fffdfb] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hpsr-border bg-[#fffdfb]/95 p-5 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Diretoria</p><h2 className="mt-1 text-lg font-black text-hpsr-text">{editing ? "Editar parceria" : "Registrar parceria"}</h2></div><button type="button" onClick={() => setCreating(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-hpsr-border text-hpsr-wine"><X size={17} /></button></div>
            <div className="space-y-4 p-4 sm:p-5">
              <ModalSection title="Identificação da parceria" description="Dados principais exibidos no card e no cabeçalho dos detalhes." icon={<Building2 size={17} />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Instituição"><input className={inputClass} value={draft.institutionName} onChange={(e) => setDraft((d) => ({ ...d, institutionName: e.target.value }))} placeholder="Ex.: Restaurante Sandy" /></Field>
                  <Field label="Tipo / categoria"><input className={inputClass} value={draft.institutionType} onChange={(e) => setDraft((d) => ({ ...d, institutionType: e.target.value }))} placeholder="Ex.: Restaurante, empresa, órgão público" /></Field>
                  <Field label="Data da parceria"><input type="date" className={inputClass} value={draft.formedAt} onChange={(e) => setDraft((d) => ({ ...d, formedAt: e.target.value }))} /></Field>
                  <Field label="Status"><select className={inputClass} value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value === "Inativa" ? "Inativa" : "Ativa" }))}><option>Ativa</option><option>Inativa</option></select></Field>
                  <div className="md:col-span-2"><Field label="Resumo para o card"><textarea rows={2} className={inputClass} value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} placeholder="Resumo curto do objetivo e dos principais benefícios da parceria." /></Field></div>
                </div>
              </ModalSection>

              <ModalSection title="Benefícios e contrapartidas" description="Registre separadamente o que o HP oferece e o que recebe da instituição parceira." icon={<BadgePercent size={17} />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="O que o HP oferece"><textarea rows={3} className={inputClass} value={draft.hpOfferSummary} onChange={(e) => setDraft((d) => ({ ...d, hpOfferSummary: e.target.value }))} placeholder="Ex.: 15% de desconto em atendimentos elegíveis durante o serviço." /></Field>
                  <Field label="O que o parceiro oferece"><textarea rows={3} className={inputClass} value={draft.partnerOfferSummary} onChange={(e) => setDraft((d) => ({ ...d, partnerOfferSummary: e.target.value }))} placeholder="Ex.: 20% de desconto aos membros do HP e prioridade no atendimento." /></Field>
                  <div className="md:col-span-2 -mt-1 text-[10px] font-semibold text-hpsr-muted">Percentuais escritos nesses campos são identificados automaticamente e usados no resumo do card.</div>
                  <div className="md:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50/70 p-4">
                      <input type="checkbox" checked={draft.offDutyService} onChange={(e) => setDraft((d) => ({ ...d, offDutyService: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                      <div><p className="text-xs font-black text-emerald-900">Parceiro atende membros do HP mesmo fora do serviço dele</p><p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-800">Benefício exclusivo da instituição parceira. O Hospital São Rafael nunca presta atendimento fora de serviço.</p></div>
                    </label>
                  </div>
                </div>
              </ModalSection>

              <ModalSection title="Integrantes da instituição" description="Digite nome e passaporte na mesma linha. Enter adiciona e já libera os campos para a próxima pessoa." icon={<UsersRound size={17} />}>
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_42px] sm:items-end">
                    <Field label="Nome"><div className="relative"><UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hpsr-wineLight" /><input className={`${inputClass} pl-9`} value={memberName} onChange={(e) => setMemberName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }} placeholder="Nome completo" /></div></Field>
                    <Field label="Passaporte"><div className="relative"><IdCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hpsr-wineLight" /><input className={`${inputClass} pl-9`} value={memberPassport} onChange={(e) => setMemberPassport(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }} placeholder="Passaporte" /></div></Field>
                    <button type="button" disabled={!memberName.trim() || !memberPassport.trim()} onClick={addMember} className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-hpsr-wine text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35" title="Adicionar integrante"><Plus size={17} /></button>
                  </div>
                  {draft.members.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-[15px] border border-hpsr-border bg-white">
                      {draft.members.map((member, index) => (
                        <div key={`${member.name}-${member.passport}-${index}`} className="flex items-center gap-3 border-b border-hpsr-border/70 px-3 py-2 last:border-b-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#f2e5d8] text-[10px] font-black text-hpsr-wine">{initials(member.name)}</div>
                          <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_180px] sm:gap-3">
                            <p className="truncate text-xs font-black text-hpsr-text">{member.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-[0.06em] text-hpsr-muted">{member.passport}</p>
                          </div>
                          <button type="button" onClick={() => setDraft((d) => ({ ...d, members: d.members.filter((_, i) => i !== index) }))} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-red-600 transition hover:bg-red-50" title="Remover integrante"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ModalSection>

              <ModalSection title="Termos e observações" description="Detalhes complementares que aparecem ao abrir a parceria." icon={<Handshake size={17} />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Termos da parceria"><textarea rows={6} className={inputClass} value={termsText} onChange={(e) => setTermsText(e.target.value)} placeholder={"Um termo por linha\nDesconto mediante identificação\nBenefício válido enquanto a parceria estiver ativa"} /></Field>
                  <Field label="Observações adicionais"><textarea rows={6} className={inputClass} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Informações internas ou observações úteis sobre a parceria." /></Field>
                </div>
              </ModalSection>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-hpsr-border bg-[#fffdfb]/95 p-4 backdrop-blur"><button type="button" onClick={() => setCreating(false)} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-xs font-black text-hpsr-wine">Cancelar</button><button type="button" disabled={saving} onClick={() => void save()} className="rounded-[14px] bg-hpsr-wine px-5 py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Salvando..." : editing ? "Salvar alterações" : "Registrar parceria"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalSection({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fbf8f5]">
    <div className="flex items-start gap-3 border-b border-hpsr-border/80 bg-white/80 px-4 py-3.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-[#f2e5d8] text-hpsr-wine">{icon}</div>
      <div><h3 className="text-sm font-black text-hpsr-text">{title}</h3><p className="mt-0.5 text-[11px] font-semibold leading-4 text-hpsr-muted">{description}</p></div>
    </div>
    <div className="p-4">{children}</div>
  </section>;
}

function MemberListBlock({ members }: { members: PartnershipMember[] }) {
  return <div className="rounded-[18px] border border-hpsr-border bg-white p-4">
    <div className="flex items-center gap-2 text-hpsr-wine"><UsersRound size={16} /><p className="text-[10px] font-black uppercase tracking-[0.14em]">Integrantes da instituição</p></div>
    {members.length ? <div className="mt-3 space-y-2">{members.map((member, index) => <div key={`${member.name}-${member.passport}-${index}`} className="flex items-center justify-between gap-3 rounded-[13px] border border-hpsr-border/80 bg-[#fbf8f5] px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-black text-hpsr-text">{member.name || "Nome não informado"}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-hpsr-muted">Passaporte: {member.passport || "não informado"}</p></div><IdCard size={16} className="shrink-0 text-hpsr-wineLight" /></div>)}</div> : <p className="mt-3 text-xs font-semibold text-hpsr-muted">Nenhum integrante informado.</p>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className={labelClass}>{label}</span>{children}</label>;
}

function DetailBlock({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <div className="rounded-[18px] border border-hpsr-border bg-white p-4"><div className="flex items-center gap-2 text-hpsr-wine"><span>{icon}</span><p className="text-[10px] font-black uppercase tracking-[0.14em]">{title}</p></div><p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-hpsr-text">{value}</p></div>;
}

function ListBlock({ icon, title, values, empty }: { icon: React.ReactNode; title: string; values: string[]; empty: string }) {
  return <div className="rounded-[18px] border border-hpsr-border bg-white p-4"><div className="flex items-center gap-2 text-hpsr-wine"><span>{icon}</span><p className="text-[10px] font-black uppercase tracking-[0.14em]">{title}</p></div>{values.length ? <ul className="mt-3 space-y-2">{values.map((value, index) => <li key={`${value}-${index}`} className="flex gap-2 text-xs font-semibold leading-5 text-hpsr-text"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-hpsr-wineLight" />{value}</li>)}</ul> : <p className="mt-3 text-xs font-semibold text-hpsr-muted">{empty}</p>}</div>;
}
