"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Handshake, ReceiptText, Search, Trash2, UserRound, UsersRound, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  readFinancialPlanEntries,
  readFinancialReceipts,
  removeFinancialReceipt,
  registerSystemActivity,
  type FinancialPlanEntry,
  type FinancialReceipt,
} from "@/lib/administrative-storage";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";

function money(value: number) {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const insurancePlans = [
  {
    id: "individual",
    name: "Plano Individual",
    price: 100000,
    description: "1 pessoa, sem dependentes",
    icon: UserRound,
  },
  {
    id: "combo",
    name: "Plano Combo",
    price: 150000,
    description: "Até 3 pessoas: titular e 2 dependentes",
    icon: UsersRound,
  },
  {
    id: "familia",
    name: "Plano Família",
    price: 200000,
    description: "Até 4 pessoas: titular e 3 dependentes",
    icon: Handshake,
  },
  {
    id: "crianca_terceira_idade",
    name: "Plano Criança e Terceira Idade",
    price: 120000,
    description: "1 pessoa: 0–17 anos ou 50+",
    icon: UserRound,
  },
] as const;

function planMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function downloadReceipt(receipt: FinancialReceipt) {
  const width = 1240;
  const rowHeight = 54;
  const height = Math.max(1500, 920 + receipt.items.length * rowHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#fffdf9";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#6f2b17";
  ctx.fillRect(0, 0, width, 190);
  ctx.fillStyle = "#fff";
  ctx.font = "700 42px Arial";
  ctx.fillText("HOSPITAL SÃO RAFAEL", 70, 82);
  ctx.font = "500 22px Arial";
  ctx.fillText("Recibo administrativo de produtos e serviços", 70, 128);
  ctx.textAlign = "right";
  ctx.font = "700 24px Arial";
  ctx.fillText(receipt.number, width - 70, 88);
  ctx.font = "500 18px Arial";
  ctx.fillText(new Date(receipt.createdAt).toLocaleString("pt-BR"), width - 70, 126);
  ctx.textAlign = "left";
  ctx.fillStyle = "#32150f";
  ctx.font = "700 24px Arial";
  ctx.fillText("DADOS DO RECIBO", 70, 255);
  [["Emitido por", receipt.issuedBy], ["Registro", receipt.issuerCrm || "Não informado"], ["Convênio", receipt.convenio], ["Unidades", String(receipt.totalUnits)]].forEach(([label, value], index) => {
    const x = 70 + (index % 2) * 555;
    const y = 305 + Math.floor(index / 2) * 86;
    ctx.fillStyle = "#8a604f";
    ctx.font = "700 16px Arial";
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = "#32150f";
    ctx.font = "600 22px Arial";
    ctx.fillText(value, x, y + 32);
  });
  let y = 500;
  ctx.fillStyle = "#f0e2d3";
  ctx.fillRect(70, y, width - 140, 54);
  ctx.fillStyle = "#6f2b17";
  ctx.font = "700 17px Arial";
  ctx.fillText("ITEM", 88, y + 34); ctx.fillText("QTD.", 730, y + 34); ctx.fillText("UNITÁRIO", 850, y + 34); ctx.fillText("TOTAL", 1060, y + 34);
  y += 54;
  receipt.items.forEach((item, index) => {
    if (index % 2 === 0) { ctx.fillStyle = "#fff7ef"; ctx.fillRect(70, y, width - 140, rowHeight); }
    ctx.fillStyle = "#32150f"; ctx.font = "600 18px Arial";
    ctx.fillText(item.name.slice(0, 55), 88, y + 34); ctx.fillText(String(item.quantity), 748, y + 34); ctx.fillText(money(item.unitPrice), 850, y + 34); ctx.fillText(money(item.total), 1060, y + 34);
    y += rowHeight;
  });
  y += 55;
  [["Subtotal", receipt.subtotal], [`Desconto (${receipt.discountPercent}%)`, -receipt.discountValue], ["Total", receipt.total]].forEach(([label, value], index) => {
    const lineY = y + index * 58;
    ctx.fillStyle = index === 2 ? "#6f2b17" : "#5f514b";
    ctx.font = index === 2 ? "700 27px Arial" : "600 20px Arial";
    ctx.fillText(String(label), 720, lineY); ctx.textAlign = "right"; ctx.fillText(money(Number(value)), width - 80, lineY); ctx.textAlign = "left";
  });
  ctx.fillStyle = "#6f2b17"; ctx.fillRect(0, height - 130, width, 130);
  ctx.fillStyle = "#fff"; ctx.font = "600 17px Arial"; ctx.fillText("Documento gerado pelo Sistema Clínico HPSR", 70, height - 76);
  ctx.font = "500 15px Arial"; ctx.fillText("O registro original permanece disponível na área Financeiro.", 70, height - 45);
  const a = document.createElement("a"); a.download = `recibo-${receipt.number}.png`; a.href = canvas.toDataURL("image/png"); a.click();
}

export default function FinancePage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [receipts, setReceipts] = useState<FinancialReceipt[]>([]);
  const [planEntries, setPlanEntries] = useState<FinancialPlanEntry[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    async function loadFinancialData() {
      const client = createClient();
      if (!client) {
        setReceipts([]);
        setPlanEntries([]);
        return;
      }

      const [receiptsResult, plansResult] = await Promise.all([
        client.from("financial_receipts").select("id, number, total, payload, created_at").order("created_at", { ascending: false }),
        client.from("financial_plan_entries").select("id, plan_id, plan_name, holder_passport, value, payload, created_at").order("created_at", { ascending: false }),
      ]);

      if (!receiptsResult.error) {
        setReceipts((receiptsResult.data || []).map((row) => ({
          ...((row.payload || {}) as FinancialReceipt),
          id: String(row.id),
          number: String(row.number),
          total: Number(row.total || 0),
          createdAt: String(((row.payload || {}) as Partial<FinancialReceipt>).createdAt || row.created_at),
          items: Array.isArray(((row.payload || {}) as Partial<FinancialReceipt>).items) ? ((row.payload || {}) as FinancialReceipt).items : [],
        })));
      }

      if (!plansResult.error) {
        setPlanEntries((plansResult.data || []).map((row) => ({
          ...((row.payload || {}) as FinancialPlanEntry),
          id: String(row.id),
          planId: String(row.plan_id || ""),
          planName: String(row.plan_name || ""),
          holderPassport: String(row.holder_passport || ""),
          value: Number(row.value || 0),
          createdAt: String(((row.payload || {}) as Partial<FinancialPlanEntry>).createdAt || row.created_at),
        })));
      }
    }

    void loadFinancialData();
  }, []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((item) => [item.number, item.issuedBy, item.convenio, ...item.items.map((line) => line.name)].join(" ").toLowerCase().includes(q));
  }, [receipts, search]);
  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return planEntries;
    return planEntries.filter((item) => [item.planName, item.holderName, item.holderPassport, item.registeredBy].join(" ").toLowerCase().includes(q));
  }, [planEntries, search]);
  const total = receipts.reduce((sum, item) => sum + item.total, 0);
  const discounts = receipts.reduce((sum, item) => sum + item.discountValue, 0);
  const plansTotal = planEntries.reduce((sum, item) => sum + item.value, 0);

  async function removeReceipt(receipt: FinancialReceipt) {
    if (!(await hpsrConfirm(`Excluir o recibo ${receipt.number} do histórico financeiro?`, "Excluir recibo"))) return;
    const removal = await removeFinancialReceipt(receipt.id);
    if (!removal.synced) { await hpsrAlert(`Não foi possível excluir o recibo${removal.error ? `: ${removal.error}` : "."}`, "Financeiro"); return; }
    setReceipts((current) => current.filter((item) => item.id !== receipt.id));
    void registerSystemActivity({ module: "Financeiro", action: "Recibo excluído", description: `Recibo ${receipt.number} removido do histórico financeiro.`, actor: currentUserProfile.systemName, reference: receipt.number });
  }

  return <div className="hpsr-page gap-3">
    <PageHeader eyebrow="Administração" title="Financeiro" description="Valores dos convênios cadastrados e histórico dos recibos gerados pelo Hospital São Rafael." />
    <div className="hpsr-page-scroll space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Planos cadastrados" value={String(planEntries.length)} />
        <Stat label="Receita de convênios" value={planMoney(plansTotal)} />
        <Stat label="Recibos registrados" value={String(receipts.length)} />
        <Stat label="Valor em recibos" value={money(total)} />
      </section>
      <section className="rounded-[18px] border border-white/70 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><Handshake size={20}/></span>
            <div>
              <h2 className="font-black text-hpsr-text">Valores dos convênios</h2>
              <p className="text-sm text-hpsr-muted">Planos disponíveis para cadastro no sistema.</p>
            </div>
          </div>
          <span className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1 text-xs font-black text-hpsr-wine">20% de desconto padrão</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {insurancePlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article key={plan.id} className="relative min-w-0 overflow-hidden rounded-[17px] border border-hpsr-border bg-[linear-gradient(135deg,#fffdf9_0%,#fff7ef_100%)] p-3.5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ead7c4]/55" />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><Icon size={18}/></span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-hpsr-wineLight">30 dias</span>
                </div>
                <h3 className="relative mt-3 min-h-[40px] text-sm font-black leading-tight text-hpsr-text">{plan.name}</h3>
                <p className="relative mt-1 min-h-[40px] text-xs leading-relaxed text-hpsr-muted">{plan.description}</p>
                <div className="relative mt-3 border-t border-hpsr-border pt-3">
                  <p className="text-[10px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Valor cadastrado</p>
                  <p className="mt-1 text-xl font-black text-hpsr-text">{planMoney(plan.price)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <div className="grid min-h-0 gap-3 xl:grid-cols-2 xl:items-start">
      <section className="min-w-0 rounded-[18px] border border-white/70 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><Handshake size={20}/></span><div><h2 className="font-black text-hpsr-text">Histórico de convênios</h2><p className="text-sm text-hpsr-muted">Planos adicionados automaticamente ao Financeiro no momento do cadastro.</p></div></div>
          <label className="flex min-h-[42px] min-w-[280px] items-center gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf4] px-3"><Search size={17} className="text-hpsr-muted"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar no histórico" className="w-full bg-transparent text-sm font-semibold outline-none"/></label>
        </div>
        <div className="mt-4 max-h-[520px] overflow-y-auto pr-1">
          <div className="grid gap-3">
          {filteredPlans.map((entry) => <article key={entry.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{entry.planName}</p><h3 className="mt-1 text-lg font-black text-hpsr-text">{entry.holderName}</h3><p className="mt-1 text-xs text-hpsr-muted">Passaporte {entry.holderPassport} · Cadastrado em {new Date(entry.createdAt).toLocaleString("pt-BR")}</p></div><div className="text-right"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Plano cadastrado</span><p className="mt-3 text-xl font-black text-hpsr-text">{planMoney(entry.value)}</p></div></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4"><Mini label="Ativação" value={new Date(`${entry.activatedAt}T12:00:00`).toLocaleDateString("pt-BR")}/><Mini label="Validade" value={new Date(`${entry.expiresAt}T12:00:00`).toLocaleDateString("pt-BR")}/><Mini label="Dependentes" value={String(entry.dependentsCount)}/><Mini label="Registrado por" value={entry.registeredBy}/></div>
          </article>)}
          {!filteredPlans.length && <div className="rounded-[16px] border border-dashed border-hpsr-border p-8 text-center"><Handshake className="mx-auto text-hpsr-wineLight"/><p className="mt-3 font-black text-hpsr-text">Nenhum convênio registrado.</p><p className="mt-1 text-sm text-hpsr-muted">Os próximos planos cadastrados aparecerão aqui automaticamente com o valor da modalidade.</p></div>}
          </div>
        </div>
      </section>
      <section className="min-w-0 rounded-[18px] border border-white/70 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><WalletCards size={20}/></span><div><h2 className="font-black text-hpsr-text">Histórico de recibos</h2><p className="text-sm text-hpsr-muted">Recibos salvos automaticamente ao serem gerados.</p></div></div>
          <span className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1 text-xs font-black text-hpsr-wine">Descontos: {money(discounts)}</span>
        </div>
        <div className="mt-4 max-h-[520px] overflow-y-auto pr-1">
          <div className="grid gap-3">
          {filtered.map((receipt) => <article key={receipt.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{receipt.number}</p><h3 className="mt-1 text-lg font-black text-hpsr-text">{money(receipt.total)}</h3><p className="mt-1 text-xs text-hpsr-muted">{new Date(receipt.createdAt).toLocaleString("pt-BR")} · {receipt.issuedBy} · {receipt.convenio}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Salvo</span></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3"><Mini label="Itens" value={String(receipt.items.length)}/><Mini label="Unidades" value={String(receipt.totalUnits)}/><Mini label="Desconto" value={`${receipt.discountPercent}%`}/></div>
            <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>downloadReceipt(receipt)} className="inline-flex items-center gap-2 rounded-xl bg-hpsr-wine px-3 py-2 text-xs font-black text-white"><Download size={14}/>Baixar recibo</button><button onClick={()=>removeReceipt(receipt)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"><Trash2 size={14}/>Excluir</button></div>
          </article>)}
          {!filtered.length && <div className="rounded-[16px] border border-dashed border-hpsr-border p-8 text-center"><ReceiptText className="mx-auto text-hpsr-wineLight"/><p className="mt-3 font-black text-hpsr-text">Nenhum recibo encontrado.</p><p className="mt-1 text-sm text-hpsr-muted">Gere um recibo na Calculadora para iniciar o histórico.</p></div>}
          </div>
        </div>
      </section>
      </div>
    </div>
  </div>;
}

function Stat({label,value}:{label:string;value:string}){return <div className="rounded-[17px] border border-white/70 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p><p className="mt-2 text-2xl font-black text-hpsr-text">{value}</p></div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-[13px] border border-hpsr-border bg-white px-3 py-2"><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p><p className="mt-1 text-sm font-black text-hpsr-text">{value}</p></div>}
