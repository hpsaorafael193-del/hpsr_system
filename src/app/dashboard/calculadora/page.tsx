"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BadgePercent,
  RotateCcw,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Handshake,
  HeartPulse,
  Minus,
  PackagePlus,
  Plus,
  ReceiptText,
  Download,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { registerSystemActivity, saveFinancialReceipt, type FinancialReceipt } from "@/lib/administrative-storage";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";

type CategoryId = "medicamentos" | "procedimentos";
type ConvenioId = "sem" | "plano" | "parceria";

type Product = {
  id: string;
  nome: string;
  descricao: string;
  categoria?: string;
  preco: number;
  precoPm?: number;
  imagem: string;
};

const medicamentos: Product[] = [
  {
    id: "m0",
    nome: "KIT MÉDICO",
    descricao: "Kit completo para primeiros socorros.",
    preco: 150000,
    precoPm: 100000,
    imagem: "Icones/produtos/Kit medico.png",
  },
  {
    id: "m1",
    nome: "BANDAGEM",
    descricao: "Utilizada para curativos rápidos.",
    preco: 30000,
    imagem: "Icones/produtos/Bandagem.png",
  },
  {
    id: "m2",
    nome: "ATADURA",
    descricao: "Faixa de suporte e imobilização.",
    preco: 20000,
    precoPm: 10000,
    imagem: "Icones/produtos/Atadura.png",
  },
  {
    id: "m3",
    nome: "ADRENALINA",
    descricao: "Medicamento para emergências graves.",
    preco: 800000,
    precoPm: 700000,
    imagem: "Icones/produtos/Adrenalina.png",
  },
  {
    id: "m4",
    nome: "SINKALME",
    descricao: "Medicamento de suporte conforme orientação.",
    preco: 50000,
    imagem: "Icones/produtos/Sinkalmy.png",
  },
  {
    id: "m5",
    nome: "RITMONEURY",
    descricao: "Medicamento de suporte conforme orientação.",
    preco: 50000,
    imagem: "Icones/produtos/Ritmoneary.png",
  },
  {
    id: "m6",
    nome: "ANALGÉSICO",
    descricao: "Alívio rápido da dor.",
    preco: 40000,
    imagem: "Icones/produtos/Analgesico.png",
  },
  {
    id: "m7",
    nome: "URSOS MÉDICOS",
    descricao: "Item médico institucional com a coleção de ursos do hospital.",
    preco: 3000000,
    imagem: "Icones/produtos/UrsinhosHP.png",
  },
];

const procedimentos: Product[] = [
  {
    id: "p0",
    nome: "TRATAMENTO NORTE",
    descricao: "Tratamento realizado na região Norte.",
    preco: 100000,
    imagem: "Icones/procedimentos/Tratamento.png",
  },
  {
    id: "p1",
    nome: "DESLOCAMENTO",
    descricao: "Atendimento com deslocamento para a região Sul.",
    preco: 150000,
    imagem: "Icones/procedimentos/Tratamento.png",
  },
  {
    id: "p2",
    nome: "RESSONÂNCIA MAGNÉTICA",
    descricao: "Exame de ressonância magnética.",
    preco: 500000,
    imagem: "Icones/procedimentos/Exames_imagem.png",
  },
  {
    id: "p3",
    nome: "RAIO-X",
    descricao: "Exame radiográfico.",
    preco: 200000,
    imagem: "Icones/procedimentos/Exames_imagem.png",
  },
  {
    id: "p4",
    nome: "EXAMES",
    descricao: "Exames clínicos e laboratoriais.",
    preco: 300000,
    imagem: "Icones/procedimentos/Exames_basicos.png",
  },
  {
    id: "p5",
    nome: "GESSO",
    descricao: "Imobilização com gesso.",
    preco: 160000,
    imagem: "Icones/procedimentos/Gesso.png",
  },
  {
    id: "p6",
    nome: "CONSULTA COM ESPECIALISTA",
    descricao: "Consulta médica especializada.",
    preco: 500000,
    imagem: "Icones/procedimentos/Consultas.png",
  },
  {
    id: "p7",
    nome: "CONSULTA COM PSICÓLOGO",
    descricao: "Consulta e acompanhamento psicológico.",
    preco: 300000,
    imagem: "Icones/procedimentos/Consultas.png",
  },
  {
    id: "p8",
    nome: "INTERNAÇÃO",
    descricao: "Serviço de internação hospitalar.",
    preco: 4000000,
    imagem: "Icones/procedimentos/Procedimentos.png",
  },
  {
    id: "p9",
    nome: "REMÉDIOS",
    descricao: "Dispensação de remédios e medicamentos gerais.",
    preco: 100000,
    imagem: "Icones/produtos/Remedios.png",
  },
];


const tabs: Array<{ id: CategoryId; label: string; icon: ReactNode; products: Product[] }> = [
  { id: "medicamentos", label: "Itens médicos", icon: <PackagePlus size={16} />, products: medicamentos },
  { id: "procedimentos", label: "Serviços Médicos", icon: <Stethoscope size={16} />, products: procedimentos },
];

const convenioOptions: Array<{ id: ConvenioId; title: string; description: string; discount: number; icon: ReactNode }> = [
  { id: "sem", title: "Sem Convênio", description: "Sem desconto", discount: 0, icon: <BadgePercent size={17} /> },
  { id: "plano", title: "Plano Médico", description: "20% de desconto", discount: 0.2, icon: <Handshake size={17} /> },
  { id: "parceria", title: "Parceria", description: "15% de desconto", discount: 0.15, icon: <CheckCircle2 size={17} /> },
];

function formatCurrency(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getImagePath(image: string) {
  return `/calculadora/${image}`;
}

function normalizeQuantity(value: string | number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

const allProducts = [...medicamentos, ...procedimentos];
const tabletHpProductIds = new Set(["p2", "p3", "p4", "p5", "p8"]);

export default function CalculatorPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<CategoryId>("medicamentos");
  const [cart, setCart] = useState<Record<string, number>>(() =>
    Object.fromEntries(allProducts.map((product) => [product.id, 0]))
  );
  const [convenio, setConvenio] = useState<ConvenioId>("sem");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPmSale, setIsPmSale] = useState(false);

  const selectedConvenio = convenioOptions.find((option) => option.id === convenio) ?? convenioOptions[0];

  const getEffectivePrice = (product: Product) => isPmSale && product.precoPm ? product.precoPm : product.preco;

  const selectedItems = useMemo(() =>
    allProducts
      .map((product) => ({ product, quantity: cart[product.id] || 0, unitPrice: isPmSale && product.precoPm ? product.precoPm : product.preco }))
      .filter((item) => item.quantity > 0),
    [cart, isPmSale]
  );

  const subtotal = selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discountValue = subtotal * selectedConvenio.discount;
  const total = Math.round(subtotal - discountValue);
  const tabletHpSubtotal = selectedItems
    .filter((item) => tabletHpProductIds.has(item.product.id))
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tabletHpTotal = Math.round(tabletHpSubtotal * (1 - selectedConvenio.discount));
  const doctorTotal = Math.max(0, total - tabletHpTotal);
  const totalUnits = selectedItems.reduce((totalItems, item) => totalItems + item.quantity, 0);

  function updateQuantity(id: string, nextQuantity: number) {
    setCart((currentCart) => ({ ...currentCart, [id]: normalizeQuantity(nextQuantity) }));
  }

  function increase(id: string) {
    setCart((currentCart) => ({ ...currentCart, [id]: (currentCart[id] || 0) + 1 }));
  }

  function decrease(id: string) {
    setCart((currentCart) => ({ ...currentCart, [id]: Math.max(0, (currentCart[id] || 0) - 1) }));
  }

  function clearProduct(id: string) {
    setCart((currentCart) => ({ ...currentCart, [id]: 0 }));
  }

  function clearAll() {
    setCart(Object.fromEntries(allProducts.map((product) => [product.id, 0])));
    setConvenio("sem");
    setSearchTerm("");
    setActiveTab("medicamentos");
    setIsPmSale(false);
  }

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeProducts = currentTab.products;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = activeProducts.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      [product.nome, product.descricao, product.categoria ?? ""].join(" ").toLowerCase().includes(normalizedSearch);

    return matchesSearch;
  });

  function createReceipt(): FinancialReceipt | null {
    if (!selectedItems.length) {
      void hpsrAlert("Selecione pelo menos um item antes de gerar o recibo.", "Nenhum item selecionado");
      return null;
    }

    const createdAt = new Date();
    const receipt: FinancialReceipt = {
      id: `receipt-${createdAt.getTime()}`,
      number: `HPSR-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")}-${String(createdAt.getTime()).slice(-6)}`,
      createdAt: createdAt.toISOString(),
      issuedBy: currentUserProfile.signatureName || currentUserProfile.systemName,
      issuerCrm: currentUserProfile.crm,
      convenio: isPmSale ? `${selectedConvenio.title} · Venda para PM` : selectedConvenio.title,
      discountPercent: Math.round(selectedConvenio.discount * 100),
      subtotal,
      discountValue,
      total,
      totalUnits,
      tabletHpTotal,
      doctorTotal,
      items: selectedItems.map(({ product, quantity, unitPrice }) => ({
        id: product.id,
        name: product.nome,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      })),
    };

    saveFinancialReceipt(receipt);
    registerSystemActivity({
      module: "Calculadora",
      action: "Recibo gerado",
      description: `Recibo ${receipt.number} salvo no Financeiro: ${formatCurrency(receipt.tabletHpTotal || 0)} para o tablet HP e ${formatCurrency(receipt.doctorTotal || 0)} para o médico.`,
      actor: receipt.issuedBy,
      reference: receipt.number,
    });
    return receipt;
  }

  function downloadReceipt(receipt: FinancialReceipt) {
    const width = 1240;
    const rowHeight = 54;
    const height = Math.max(1580, 1000 + receipt.items.length * rowHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#fffdf9";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#6f2b17";
    context.fillRect(0, 0, width, 190);
    context.fillStyle = "#ffffff";
    context.font = "700 42px Arial";
    context.fillText("HOSPITAL SÃO RAFAEL", 70, 82);
    context.font = "500 22px Arial";
    context.fillText("Recibo administrativo de produtos e serviços", 70, 128);
    context.textAlign = "right";
    context.font = "700 24px Arial";
    context.fillText(receipt.number, width - 70, 88);
    context.font = "500 18px Arial";
    context.fillText(new Date(receipt.createdAt).toLocaleString("pt-BR"), width - 70, 126);
    context.textAlign = "left";

    context.fillStyle = "#32150f";
    context.font = "700 24px Arial";
    context.fillText("DADOS DO RECIBO", 70, 255);
    const meta = [
      ["Emitido por", receipt.issuedBy],
      ["Registro", receipt.issuerCrm || "Não informado"],
      ["Convênio", receipt.convenio],
      ["Unidades", String(receipt.totalUnits)],
    ];
    meta.forEach(([label, value], index) => {
      const x = 70 + (index % 2) * 555;
      const y = 305 + Math.floor(index / 2) * 86;
      context.fillStyle = "#8a604f";
      context.font = "700 16px Arial";
      context.fillText(label.toUpperCase(), x, y);
      context.fillStyle = "#32150f";
      context.font = "600 22px Arial";
      context.fillText(value, x, y + 32);
    });

    let y = 500;
    context.fillStyle = "#f0e2d3";
    context.fillRect(70, y, width - 140, 54);
    context.fillStyle = "#6f2b17";
    context.font = "700 17px Arial";
    context.fillText("ITEM", 88, y + 34);
    context.fillText("QTD.", 730, y + 34);
    context.fillText("UNITÁRIO", 850, y + 34);
    context.fillText("TOTAL", 1060, y + 34);
    y += 54;

    receipt.items.forEach((item, index) => {
      if (index % 2 === 0) {
        context.fillStyle = "#fff7ef";
        context.fillRect(70, y, width - 140, rowHeight);
      }
      context.fillStyle = "#32150f";
      context.font = "600 18px Arial";
      context.fillText(item.name.slice(0, 55), 88, y + 34);
      context.fillText(String(item.quantity), 748, y + 34);
      context.fillText(formatCurrency(item.unitPrice), 850, y + 34);
      context.fillText(formatCurrency(item.total), 1060, y + 34);
      y += rowHeight;
    });

    y += 50;
    context.strokeStyle = "#dbc2ae";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(690, y);
    context.lineTo(width - 70, y);
    context.stroke();
    const totals = [
      ["Subtotal", receipt.subtotal],
      [`Desconto (${receipt.discountPercent}%)`, -receipt.discountValue],
      ["Total", receipt.total],
    ] as const;
    totals.forEach(([label, value], index) => {
      const lineY = y + 55 + index * 58;
      context.fillStyle = index === 2 ? "#6f2b17" : "#5f514b";
      context.font = index === 2 ? "700 27px Arial" : "600 20px Arial";
      context.fillText(label, 720, lineY);
      context.textAlign = "right";
      context.fillText(formatCurrency(value), width - 80, lineY);
      context.textAlign = "left";
    });

    context.fillStyle = "#6f2b17";
    context.fillRect(0, height - 130, width, 130);
    context.fillStyle = "#ffffff";
    context.font = "600 17px Arial";
    context.fillText("Documento gerado pelo Sistema Clínico HPSR", 70, height - 76);
    context.font = "500 15px Arial";
    context.fillText("O registro original permanece disponível na área Financeiro.", 70, height - 45);

    const anchor = document.createElement("a");
    anchor.download = `recibo-${receipt.number}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  function generateAndDownloadReceipt() {
    const receipt = createReceipt();
    if (!receipt) return;
    downloadReceipt(receipt);
  }

  return (
    <div className="hpsr-page gap-4">
      <PageHeader
        eyebrow="Ferramentas"
        title="Calculadora"
        description="Calculadora de valores do Hospital São Rafael."
      />

      <div className="hpsr-page-scroll space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-stretch">
        <div className="order-2 flex min-h-[210px] flex-col rounded-[20px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf6_100%)] p-4 shadow-[0_14px_34px_rgba(79,42,21,0.07)] xl:order-1 xl:h-full">
          <div className="mb-2 flex items-center gap-2 border-b border-hpsr-border/80 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
              <Handshake size={20} />
            </div>
            <div>
              <p className="text-[1.05rem] font-black text-hpsr-text">Convênio do Cliente</p>
            </div>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            {convenioOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setConvenio(option.id)}
                className={`group relative flex min-h-[112px] h-full items-center justify-center overflow-hidden rounded-[16px] border px-4 py-3 text-center transition duration-200 ${
                  convenio === option.id
                    ? "border-hpsr-wine bg-[linear-gradient(135deg,#6a1707_0%,#842713_60%,#9b4129_100%)] text-white shadow-[0_18px_32px_rgba(108,33,12,0.18)]"
                    : "border-[#e7d2bf] bg-[linear-gradient(180deg,#fffdfa_0%,#fcf3e8_100%)] text-hpsr-text shadow-[0_10px_24px_rgba(113,74,41,0.06)] hover:border-hpsr-wine/30 hover:shadow-[0_14px_26px_rgba(113,74,41,0.10)]"
                }`}
              >
                {convenio === option.id && (
                  <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white text-hpsr-wine shadow-sm">
                    <CheckCircle2 size={15} />
                  </span>
                )}

                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    convenio === option.id
                      ? "text-white"
                      : "text-hpsr-wine"
                  }`}>
                    {option.icon}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center pt-4">
                  <p className="mt-2 text-[1.02rem] font-black leading-tight">{option.title}</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${
                    convenio === option.id ? "bg-white/16 text-white" : "bg-[#efe1cf] text-hpsr-wine"
                  }`}>
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${isPmSale ? "bg-blue-700 text-white" : "bg-[#f1dfcd] text-hpsr-wine"}`}>
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-hpsr-text">Tipo de venda</p>
                <p className="text-[11px] font-semibold text-hpsr-muted">Escolha se a venda será Civil ou PM.</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsPmSale(false)}
                aria-pressed={!isPmSale}
                className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-black transition ${
                  !isPmSale
                    ? "border border-hpsr-wine bg-white text-hpsr-wine shadow-sm"
                    : "border border-hpsr-border bg-[#fffdfa] text-hpsr-muted hover:bg-white"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${!isPmSale ? "bg-hpsr-wine" : "bg-hpsr-muted/40"}`} />
                Civil
              </button>
              <button
                type="button"
                onClick={() => setIsPmSale(true)}
                aria-pressed={isPmSale}
                className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-black transition ${
                  isPmSale
                    ? "bg-blue-700 text-white shadow-sm"
                    : "border border-hpsr-border bg-[#fffdfa] text-hpsr-wine hover:bg-white"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isPmSale ? "bg-white" : "bg-hpsr-wineLight"}`} />
                PM
              </button>
            </div>
          </div>
        </div>

        <section className="order-1 min-h-[210px] overflow-hidden rounded-[20px] border border-hpsr-border bg-[linear-gradient(180deg,#fffaf4_0%,#fff4e7_100%)] shadow-[0_14px_34px_rgba(79,42,21,0.07)] xl:order-2 xl:h-full">
          <div className="flex h-full flex-col p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[12px] bg-hpsr-wine text-white">
                <ReceiptText size={17} />
              </div>
              <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Fechamento</p><p className="text-[1.02rem] font-black text-hpsr-text">Resumo da compra</p></div>
            </div>

            <div className="flex flex-1 flex-col border-t border-dashed border-hpsr-border pt-3">
              <div className="flex items-center justify-between gap-3 text-xs font-black text-hpsr-muted">
                <span>Total cobrado do jogador</span>
                <span>Convênio</span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div><p className="text-[clamp(1.8rem,2.8vw,2.5rem)] font-black tracking-tight text-hpsr-text">{formatCurrency(total)}</p><p className="mt-1 text-[11px] font-bold text-hpsr-muted">{totalUnits} unidade{totalUnits === 1 ? "" : "s"} · {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}</p></div>
                <span className="rounded-full border border-hpsr-border bg-[#f1dfcd] px-4 py-1.5 text-[12px] font-black text-hpsr-wine">
                  {isPmSale ? `${selectedConvenio.title} · PM` : selectedConvenio.title}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-[14px] border border-blue-200 bg-blue-50 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[.1em] text-blue-700">Vai para o tablet HP</p>
                  <p className="mt-1 text-lg font-black text-blue-950">{formatCurrency(tabletHpTotal)}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-relaxed text-blue-800">Procedimentos, exames, Raio-X e ressonâncias.</p>
                </div>
                <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[.1em] text-emerald-700">Fica com o médico</p>
                  <p className="mt-1 text-lg font-black text-emerald-950">{formatCurrency(doctorTotal)}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-relaxed text-emerald-800">Valor restante após o repasse ao hospital.</p>
                </div>
              </div>

              <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <button
                  type="button"
                  onClick={generateAndDownloadReceipt}
                  disabled={!selectedItems.length}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white transition hover:bg-hpsr-wineLight disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Download size={16} />
                  Gerar recibo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]"
                >
                  <RotateCcw size={16} />
                  Limpar seleção
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] font-semibold leading-relaxed text-hpsr-muted">
                Ao gerar, o recibo é baixado em PNG e salvo automaticamente no histórico financeiro.
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] shadow-[0_14px_34px_rgba(79,42,21,0.07)] lg:min-h-[620px]">
        <div className="shrink-0 border-b border-hpsr-border/70 bg-[linear-gradient(180deg,#f8f1e8_0%,#f4ebe0_100%)] p-2.5">
          <div className="grid gap-2 rounded-[16px] bg-[#f0e7dd] p-2 lg:grid-cols-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[14px] px-3 text-[11px] font-black transition ${
                  activeTab === tab.id
                    ? "bg-white text-hpsr-wine"
                    : "text-hpsr-wine hover:bg-white/60"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-b border-hpsr-border/70 px-3.5 py-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-hpsr-wine text-white">
                {currentTab.icon}
              </div>
              <div>
                <h2 className="text-lg font-black text-hpsr-text">{currentTab.label}</h2>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">
                  Defina livremente a quantidade de cada item, sem limite por produto.
                </p>
              </div>
            </div>

            <label className="flex min-h-[38px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
              <Search size={18} className="text-hpsr-muted" />
              <input
                className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar item"
              />
            </label>
          </div>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
          <ProductGrid
            products={filteredProducts}
            cart={cart}
            onIncrease={increase}
            onDecrease={decrease}
            onChangeQuantity={updateQuantity}
            onClear={clearProduct}
            getPrice={getEffectivePrice}
            isPmSale={isPmSale}
          />
        </div>
      </section>
      </div>
    </div>
  );
}

function ProductGrid({
  products,
  cart,
  onIncrease,
  onDecrease,
  onChangeQuantity,
  onClear,
  getPrice,
  isPmSale,
}: {
  products: Product[];
  cart: Record<string, number>;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onClear: (id: string) => void;
  getPrice: (product: Product) => number;
  isPmSale: boolean;
}) {
  if (!products.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
        <p className="font-black text-hpsr-text">Nenhum item encontrado.</p>
        <p className="mt-1 text-sm text-hpsr-muted">Tente buscar por outro nome ou categoria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={cart[product.id] || 0}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onChangeQuantity={onChangeQuantity}
          onClear={onClear}
          effectivePrice={getPrice(product)}
          isPmSale={isPmSale}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  quantity,
  onIncrease,
  onDecrease,
  onChangeQuantity,
  onClear,
  effectivePrice,
  isPmSale,
}: {
  product: Product;
  quantity: number;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onClear: (id: string) => void;
  effectivePrice: number;
  isPmSale: boolean;
}) {
  const active = quantity > 0;
  const hasPmPrice = isPmSale && Boolean(product.precoPm);

  return (
    <article className={`relative overflow-hidden rounded-[18px] border bg-[linear-gradient(180deg,#fffefb_0%,#fff8f1_100%)] p-3.5 text-center shadow-[0_10px_24px_rgba(82,48,27,0.05)] transition duration-200 ${
      active ? "border-hpsr-wine shadow-[0_14px_30px_rgba(111,43,23,0.12)]" : "border-hpsr-border hover:-translate-y-0.5 hover:border-hpsr-wine/30 hover:bg-white hover:shadow-[0_14px_28px_rgba(82,48,27,0.09)]"
    }`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-hpsr-wine/35 to-transparent" />
      {active && (
        <span className="absolute right-4 top-4 rounded-full bg-[#f1dfcd] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wine">
          Selecionado
        </span>
      )}
      <div className="mx-auto flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-[16px] border border-hpsr-border bg-white p-2.5">
        <img
          src={getImagePath(product.imagem)}
          alt={product.nome}
          className="h-full w-full scale-[1.24] object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>

      <h3 className="mt-3 text-[13px] font-black uppercase tracking-tight text-hpsr-text">{product.nome}</h3>
      <p className="mx-auto mt-1.5 min-h-[28px] max-w-sm text-[11px] font-semibold leading-relaxed text-hpsr-muted">{product.descricao}</p>

      <div className="mt-2.5 flex items-center justify-center">
        <p className="inline-flex rounded-full bg-[#f1dfcd] px-3 py-1 text-[15px] font-black text-hpsr-text">
          {formatCurrency(effectivePrice)}
        </p>
      </div>
      <div className="mt-1.5 flex min-h-[20px] flex-wrap items-center justify-center gap-1.5">
        {hasPmPrice && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">Valor PM</span>}
      </div>

      <div className="mt-2.5 space-y-2">
        <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-[16px] border border-hpsr-border/80 bg-white/[0.95] px-2 py-1.5 shadow-[0_8px_18px_rgba(97,58,28,0.06)]">
          <button
            type="button"
            onClick={() => onDecrease(product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white transition hover:bg-hpsr-wineLight"
          >
            <Minus size={15} />
          </button>
          <input
            value={quantity}
            onChange={(event) => onChangeQuantity(product.id, normalizeQuantity(event.target.value))}
            inputMode="numeric"
            className="h-8 w-[76px] min-w-0 rounded-[11px] border border-hpsr-border bg-[#fffdfa] px-2 text-center text-sm font-black text-hpsr-text outline-none focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
          />
          <button
            type="button"
            onClick={() => onIncrease(product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white transition hover:bg-hpsr-wineLight"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onClear(product.id)}
            disabled={!active}
            className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-hpsr-border disabled:bg-[#fffaf4] disabled:text-hpsr-muted/55"
          >
            <Trash2 size={14} />
            Zerar item
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-hpsr-border bg-white/[0.86] px-3 py-2">
      <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</span>
      <span className="mt-1 block text-[13px] font-black text-hpsr-text">{value}</span>
    </div>
  );
}
