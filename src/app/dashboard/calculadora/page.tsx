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
  LayoutGrid,
  List,
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
    id: "p10",
    nome: "DESLOCAMENTO (ILHAS)",
    descricao: "Atendimento com deslocamento para as Ilhas.",
    preco: 300000,
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
    descricao: "Consulta e acompanhamento psicológico e psiquiátrico.",
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
    preco: 20000,
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
  { id: "parceria", title: "Parceria", description: "10% de desconto", discount: 0.10, icon: <CheckCircle2 size={17} /> },
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
const tabletHpProductIds = new Set(["p2", "p3", "p4", "p8"]);

export default function CalculatorPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<CategoryId>("medicamentos");
  const [cart, setCart] = useState<Record<string, number>>(() =>
    Object.fromEntries(allProducts.map((product) => [product.id, 0]))
  );
  const [convenio, setConvenio] = useState<ConvenioId>("sem");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPmSale, setIsPmSale] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

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

  async function createReceipt(): Promise<FinancialReceipt | null> {
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

    const saveResult = await saveFinancialReceipt(receipt);
    if (!saveResult.synced) {
      await hpsrAlert(`O recibo não foi salvo no Supabase${saveResult.error ? `: ${saveResult.error}` : "."}`, "Falha ao salvar recibo");
      return null;
    }
    void registerSystemActivity({
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

  async function generateAndDownloadReceipt() {
    const receipt = await createReceipt();
    if (!receipt) return;
    downloadReceipt(receipt);
  }

  return (
    <div className="hpsr-page hpsr-calculadora-page gap-0 xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
      <PageHeader
        eyebrow="Ferramentas"
        title="Calculadora"
        description="Calculadora de valores do Hospital São Rafael."
      />

      <div className="hpsr-page-scroll min-h-0 flex-1 overflow-hidden">
      <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-stretch">
        <div className="order-2 min-h-0 overflow-hidden xl:order-1">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] shadow-[0_14px_34px_rgba(79,42,21,0.07)]">
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

            <div className="shrink-0 border-b border-hpsr-border/70 px-3.5 py-2.5">
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

                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex min-h-[38px] flex-1 items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
                    <Search size={18} className="text-hpsr-muted" />
                    <input
                      className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar item"
                    />
                  </label>
                  <div className="inline-flex shrink-0 rounded-[14px] border border-hpsr-border bg-[#f0e7dd] p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      aria-pressed={viewMode === "cards"}
                      className={`inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[11px] px-3 text-[11px] font-black transition ${
                        viewMode === "cards" ? "bg-white text-hpsr-wine shadow-sm" : "text-hpsr-muted hover:text-hpsr-wine"
                      }`}
                    >
                      <LayoutGrid size={15} />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-pressed={viewMode === "list"}
                      className={`inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[11px] px-3 text-[11px] font-black transition ${
                        viewMode === "list" ? "bg-white text-hpsr-wine shadow-sm" : "text-hpsr-muted hover:text-hpsr-wine"
                      }`}
                    >
                      <List size={15} />
                      Modo lista
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-3.5 pb-3.5 pt-3">
              {viewMode === "list" ? (
                <ProductList
                  products={filteredProducts}
                  cart={cart}
                  onIncrease={increase}
                  onDecrease={decrease}
                  onChangeQuantity={updateQuantity}
                  onClear={clearProduct}
                  getPrice={getEffectivePrice}
                  isPmSale={isPmSale}
                />
              ) : (
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
              )}
            </div>
          </section>
        </div>

        <aside className="order-1 min-h-0 overflow-hidden xl:order-2">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-[0_18px_42px_rgba(79,42,21,0.09)]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(145deg,#fff8f1_0%,#f8eadc_100%)] p-4">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
                    <ReceiptText size={19} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Fechamento</p>
                    <h2 className="text-lg font-black text-hpsr-text">Resumo da compra</h2>
                  </div>
                </div>
                <span className="rounded-full border border-hpsr-border bg-white/80 px-3 py-1.5 text-[11px] font-black text-hpsr-wine">
                  {totalUnits} items
                </span>
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#d9cbbb] bg-[linear-gradient(180deg,#fffefd_0%,#fff8f1_100%)] p-4 shadow-[0_10px_28px_rgba(90,46,24,0.07)]">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dashed border-[#cfbda9] pb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.08em] text-hpsr-muted">Condições da compra</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#ddc4ae] bg-[#f3e3d2] px-3 py-1 text-[11px] font-black text-hpsr-wine">{selectedConvenio.title}</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isPmSale ? "bg-blue-700 text-white" : "bg-[#f4ece3] text-hpsr-wine"}`}>{isPmSale ? "PM" : "Civil"}</span>
                    </div>
                  </div>
                  <div className="inline-flex rounded-[12px] border border-[#dfcdbb] bg-[#f7efe6] p-1">
                    <button
                      type="button"
                      onClick={() => setIsPmSale(false)}
                      aria-pressed={!isPmSale}
                      className={`inline-flex min-h-[34px] items-center justify-center gap-2 rounded-[10px] px-3 text-[11px] font-black transition ${
                        !isPmSale
                          ? "border border-hpsr-wine bg-white text-hpsr-wine shadow-sm"
                          : "border border-transparent bg-transparent text-hpsr-muted hover:bg-white/70"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${!isPmSale ? "bg-hpsr-wine" : "bg-hpsr-muted/40"}`} />
                      Civil
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPmSale(true)}
                      aria-pressed={isPmSale}
                      className={`inline-flex min-h-[34px] items-center justify-center gap-2 rounded-[10px] px-3 text-[11px] font-black transition ${
                        isPmSale
                          ? "border border-blue-700 bg-blue-700 text-white shadow-sm"
                          : "border border-transparent bg-transparent text-hpsr-muted hover:bg-white/70"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isPmSale ? "bg-white" : "bg-hpsr-muted/40"}`} />
                      PM
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid shrink-0 gap-2">
                  {convenioOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setConvenio(option.id)}
                      className={`group flex min-h-[52px] items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 text-left transition ${
                        convenio === option.id
                          ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_8px_18px_rgba(103,38,20,0.15)]"
                          : "border-[#e5d3c2] bg-white/90 text-hpsr-text hover:border-hpsr-wine/35 hover:bg-[#fff8f0]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] ${convenio === option.id ? "bg-white/15 text-white" : "bg-[#f2e4d5] text-hpsr-wine"}`}>{option.icon}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-black">{option.title}</span>
                          <span className={`mt-0.5 block text-[10px] font-bold ${convenio === option.id ? "text-white/75" : "text-hpsr-muted"}`}>{option.description}</span>
                        </span>
                      </span>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${convenio === option.id ? "border-white/35 bg-white text-hpsr-wine" : "border-hpsr-border bg-[#fffaf4] text-hpsr-muted"}`}>
                        {convenio === option.id ? <CheckCircle2 size={14} /> : <span className="h-2 w-2 rounded-full bg-current opacity-40" />}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-dashed border-[#cfbda9] pt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[.08em] text-hpsr-muted">Itens da compra</p>
                    <p className="text-[11px] font-bold text-hpsr-muted">Qtd. total: {totalUnits}</p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                    {selectedItems.length ? (
                      <div className="space-y-2.5">
                        {selectedItems.map((item, index) => (
                          <div key={item.product.id} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-3 text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f2e2d4] text-[11px] font-black text-hpsr-wine">{index + 1}</span>
                            <div className="min-w-0">
                              <p className="truncate font-black text-hpsr-text">{item.product.nome}</p>
                              <p className="text-[11px] font-semibold text-hpsr-muted">{item.quantity} × {formatCurrency(getEffectivePrice(item.product))}</p>
                            </div>
                            <p className="font-black text-hpsr-text">{formatCurrency(item.quantity * getEffectivePrice(item.product))}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-[120px] items-center justify-center text-center">
                        <div>
                          <p className="text-[12px] font-black text-hpsr-muted">Nenhum item selecionado</p>
                          <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">Adicione itens para preencher a prévia do recibo.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 shrink-0 border-t border-dashed border-[#cbb8a2] pt-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-hpsr-text">Subtotal</span>
                      <span className="font-semibold text-hpsr-text">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-hpsr-text">Repasse ao Tablet HP</span>
                      <span className="font-semibold text-blue-700">{formatCurrency(tabletHpTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-hpsr-text">Valor do médico</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(doctorTotal)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-muted">Valor final</p>
                      <p className="text-[1.15rem] font-black text-hpsr-text">TOTAL</p>
                    </div>
                    <p className="text-[2rem] font-black tracking-tight text-hpsr-text">{formatCurrency(total)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 border-t border-hpsr-border bg-white p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <button
                type="button"
                onClick={() => void generateAndDownloadReceipt()}
                disabled={!selectedItems.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white transition hover:bg-hpsr-wineLight disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Download size={16} />
                Gerar recibo
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fff3e8]"
              >
                <RotateCcw size={16} />
                Limpar seleção
              </button>
              <p className="text-center text-[9px] font-semibold leading-relaxed text-hpsr-muted sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                O recibo é salvo no histórico financeiro após a confirmação.
              </p>
            </div>
          </section>
        </aside>
      </section>
      </div>
    </div>
  );
}


function ProductList({
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
    <div className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white shadow-[0_10px_24px_rgba(82,48,27,0.05)]">
      <div className="hidden grid-cols-[72px_minmax(220px,1fr)_150px_150px_230px] items-center gap-3 bg-hpsr-wine px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-white lg:grid">
        <span>Imagem</span>
        <span>Produto</span>
        <span>Preço</span>
        <span>Quantidade</span>
        <span className="text-right">Controles</span>
      </div>
      <div className="divide-y divide-hpsr-border/80">
        {products.map((product) => {
          const quantity = cart[product.id] || 0;
          const active = quantity > 0;
          const effectivePrice = getPrice(product);
          const hasPmPrice = isPmSale && Boolean(product.precoPm);
          return (
            <article
              key={product.id}
              className={`grid gap-3 px-3 py-3 transition lg:grid-cols-[72px_minmax(220px,1fr)_150px_150px_230px] lg:items-center lg:px-4 ${
                active ? "bg-[#fff8f0]" : "bg-white hover:bg-[#fffdf9]"
              }`}
            >
              <div className="flex items-center gap-3 lg:block">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-hpsr-border bg-[#fffaf4] p-1.5">
                  <img
                    src={getImagePath(product.imagem)}
                    alt={product.nome}
                    className="h-full w-full object-contain"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                </div>
                <div className="min-w-0 lg:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-hpsr-muted">Produto</p>
                  <p className="truncate text-sm font-black text-hpsr-text">{product.nome}</p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="hidden items-center gap-2 lg:flex">
                  <h3 className="truncate text-sm font-black text-hpsr-text">{product.nome}</h3>
                  {active && <span className="rounded-full bg-[#f1dfcd] px-2 py-0.5 text-[9px] font-black uppercase text-hpsr-wine">Selecionado</span>}
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-hpsr-muted">{product.descricao}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-hpsr-muted lg:hidden">Preço</p>
                <p className="text-sm font-black text-hpsr-text">{formatCurrency(effectivePrice)}</p>
                {hasPmPrice && <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-800">Valor PM</span>}
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.1em] text-hpsr-muted lg:hidden">Quantidade</p>
                <input
                  value={quantity}
                  onChange={(event) => onChangeQuantity(product.id, normalizeQuantity(event.target.value))}
                  inputMode="numeric"
                  aria-label={`Quantidade de ${product.nome}`}
                  className="h-10 w-full max-w-[110px] rounded-[12px] border border-hpsr-border bg-[#fffdfa] px-3 text-center text-sm font-black text-hpsr-text outline-none focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button type="button" onClick={() => onDecrease(product.id)} className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-rose-500 text-white transition hover:bg-rose-600" aria-label={`Diminuir ${product.nome}`}>
                  <Minus size={15} />
                </button>
                <button type="button" onClick={() => onIncrease(product.id)} className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-emerald-600 text-white transition hover:bg-emerald-700" aria-label={`Aumentar ${product.nome}`}>
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onClear(product.id)}
                  disabled={!active}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[11px] border border-hpsr-border bg-[#fffaf4] px-3 text-[10px] font-black text-hpsr-wine transition hover:bg-[#fff8f0] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RotateCcw size={13} />
                  Zerar
                </button>
              </div>
            </article>
          );
        })}
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
